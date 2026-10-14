import { execFileSync } from 'child_process';
import * as p from '@clack/prompts';
import {
  CLIENTS,
  HOSTED_URL,
  type AddMode,
  type McpClient,
} from './clients.js';
import { verifyApiKey } from './verify-key.js';
import { parseWizardArgs, wizardUsage } from './args.js';

const API_KEYS_URL = 'https://www.runpod.io/console/user/settings';

// Open a URL in the user's default browser. Best-effort and non-fatal.
function openBrowser(url: string): void {
  try {
    // The URL is a literal arg, not an interpolated string. The Windows branch is
    // the exception: `start` is a cmd built-in, so that one does go through a shell
    // (the first quoted arg is the window title, hence the empty ''). Safe only
    // because every URL reaching here is a compile-time constant — do not extend
    // this to a URL from user input without escaping it.
    if (process.platform === 'darwin') {
      execFileSync('open', [url], { stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      execFileSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
    } else {
      execFileSync('xdg-open', [url], { stdio: 'ignore' });
    }
  } catch {
    // Ignore — the user can open the URL manually.
  }
}

function bail(message = 'Cancelled.'): never {
  p.cancel(message);
  process.exit(0);
}

async function promptForApiKey(): Promise<string> {
  // Trimmed like the pasted path below. An env var picked up from a shell profile
  // or a .env file can carry a trailing newline, which would otherwise be written
  // verbatim into every client config and, on Windows, reach a shim's `%*`.
  const fromEnv = process.env.RUNPOD_API_KEY?.trim();
  if (fromEnv) {
    const useEnv = await p.confirm({
      message: 'Use the RUNPOD_API_KEY from your environment?',
    });
    if (p.isCancel(useEnv)) bail();
    if (useEnv) return fromEnv;
  }

  const create = await p.confirm({
    message: 'Open the Runpod console to create or copy an API key?',
  });
  if (p.isCancel(create)) bail();
  if (create) {
    openBrowser(API_KEYS_URL);
    p.log.info(`Opening ${API_KEYS_URL}`);
  }

  const apiKey = await p.password({
    message: 'Paste your Runpod API key',
    validate: (value) =>
      !value || value.trim().length === 0
        ? 'API key cannot be empty'
        : undefined,
  });
  if (p.isCancel(apiKey)) bail();
  return apiKey.trim();
}

async function selectClients(
  detected: Map<string, boolean>,
  verb: string
): Promise<McpClient[]> {
  const options = CLIENTS.map((client) => ({
    value: client.id,
    label: client.name,
    hint: detected.get(client.id) ? 'detected' : undefined,
  }));

  const selected = await p.multiselect<string>({
    message: `Which agents should we ${verb}?`,
    options,
    // Pre-select detected clients so the common case is a single Enter press.
    initialValues: CLIENTS.filter((c) => detected.get(c.id)).map((c) => c.id),
    required: true,
  });
  if (p.isCancel(selected)) bail();

  return CLIENTS.filter((c) => selected.includes(c.id));
}

async function detectAll(): Promise<Map<string, boolean>> {
  const entries = await Promise.all(
    CLIENTS.map(async (c) => [c.id, await c.detect()] as const)
  );
  return new Map(entries);
}

// Ask how the server should be wired up, then collect what that mode needs.
// Hosted is the default: the client signs in with Runpod over OAuth and no key
// is ever written to disk. Local runs the server via npx with an API key.
async function selectMode(): Promise<AddMode> {
  const kind = await p.select({
    message: 'How do you want to connect to Runpod?',
    options: [
      {
        value: 'hosted',
        label: 'Sign in with Runpod (recommended)',
        hint: 'hosted, OAuth, no API key stored',
      },
      {
        value: 'local',
        label: 'Run locally with an API key',
        hint: 'runs on this machine via npx',
      },
    ],
    initialValue: 'hosted',
  });
  if (p.isCancel(kind)) bail();

  if (kind === 'hosted') {
    return { kind: 'hosted', url: HOSTED_URL };
  }

  const apiKey = await promptForApiKey();

  const verifySpinner = p.spinner();
  verifySpinner.start('Verifying API key');
  const valid = await verifyApiKey(apiKey);
  if (valid === true) {
    verifySpinner.stop('API key verified.');
  } else if (valid === false) {
    verifySpinner.stop('API key rejected by Runpod.');
    const proceed = await p.confirm({
      message: 'The key did not authenticate. Continue anyway?',
      initialValue: false,
    });
    if (p.isCancel(proceed) || !proceed) bail();
  } else {
    verifySpinner.stop('Could not verify the key (offline?). Continuing.');
  }

  return { kind: 'local', apiKey };
}

async function runAdd(): Promise<void> {
  const detected = await detectAll();
  const clients = await selectClients(detected, 'set up');
  const mode = await selectMode();

  const results: string[] = [];
  for (const client of clients) {
    const spinner = p.spinner();
    spinner.start(`Configuring ${client.name}`);
    const result = await client.add(mode);
    if (result.success) {
      spinner.stop(`${client.name} configured.`);
      // A success can still carry a caveat — notably "the entry already existed, so
      // your key was NOT updated". Dropping the message turned that into an
      // unqualified tick, which is how a user rotating their key would end up with
      // the old one still in place.
      results.push(
        `✓ ${client.name} — ${result.message ? `${result.message}; ` : ''}${client.describeTarget()}`
      );
    } else {
      spinner.stop(`${client.name} failed.`);
      results.push(`✗ ${client.name} — ${result.message ?? 'unknown error'}`);
    }
  }

  p.note(results.join('\n'), 'Results');
  p.outro(
    mode.kind === 'hosted'
      ? 'Restart your agent, then complete "Sign in with Runpod" when it connects.'
      : 'Restart your agent (or reconnect MCP) to load the Runpod tools.'
  );
}

async function runRemove(): Promise<void> {
  const detected = await detectAll();
  const clients = await selectClients(detected, 'remove Runpod from');

  const results: string[] = [];
  for (const client of clients) {
    const spinner = p.spinner();
    spinner.start(`Removing from ${client.name}`);
    const result = await client.remove();
    spinner.stop(
      result.success ? `${client.name} cleaned up.` : `${client.name} failed.`
    );
    results.push(
      `${result.success ? '✓' : '✗'} ${client.name}${
        result.message ? ` — ${result.message}` : ''
      }`
    );
  }

  p.note(results.join('\n'), 'Results');
  p.outro('Done.');
}

// How each client finishes the hosted OAuth sign-in, for the result lines.
const SIGN_IN: Record<string, string> = {
  'claude-code': 'in Claude Code run /mcp → runpod → Sign in with Runpod',
  opencode: 'run `opencode mcp auth runpod`',
  pi: 'run `pi mcp login runpod`',
};

function signInStep(client: McpClient): string {
  return (
    SIGN_IN[client.id] ??
    'restart it; it opens "Sign in with Runpod" when it connects'
  );
}

// The flag-driven path: no prompts, plain output, and an exit code that says
// what happened, so an agent or a script can rely on it.
async function runNonInteractive(
  subcommand: string,
  clientIds: string[],
  requestedMode: 'hosted' | 'local' | undefined
): Promise<number> {
  const clients = clientIds.map((id) => CLIENTS.find((c) => c.id === id)!);

  if (subcommand === 'remove') {
    let failed = 0;
    for (const client of clients) {
      const result = await client.remove();
      if (!result.success) failed++;
      console.log(
        `${result.success ? '✓' : '✗'} ${client.name}${result.message ? ` — ${result.message}` : ''}`
      );
    }
    return failed ? 1 : 0;
  }

  let mode: AddMode = { kind: 'hosted', url: HOSTED_URL };
  if (requestedMode === 'local') {
    const apiKey = process.env.RUNPOD_API_KEY?.trim();
    if (!apiKey) {
      console.error(
        '--local reads the API key from RUNPOD_API_KEY, which is not set. Export it, or use --hosted to sign in with Runpod instead.'
      );
      return 2;
    }
    const valid = await verifyApiKey(apiKey);
    if (valid === false) {
      console.error(
        'RUNPOD_API_KEY was rejected by Runpod. Nothing was configured.'
      );
      return 1;
    }
    if (valid === null)
      console.error('Could not verify RUNPOD_API_KEY (offline?). Continuing.');
    mode = { kind: 'local', apiKey };
  }

  let failed = 0;
  for (const client of clients) {
    const result = await client.add(mode);
    if (result.success) {
      console.log(
        `✓ ${client.name} — ${result.message ? `${result.message}; ` : ''}${client.describeTarget()}`
      );
    } else {
      failed++;
      console.log(`✗ ${client.name} — ${result.message ?? 'unknown error'}`);
    }
  }
  for (const client of clients) {
    console.log(
      mode.kind === 'hosted'
        ? `Next for ${client.name}: ${signInStep(client)}.`
        : `Next for ${client.name}: restart it (or reconnect MCP) to load the Runpod tools.`
    );
  }
  return failed ? 1 : 0;
}

async function listClients(): Promise<void> {
  const detected = await detectAll();
  for (const client of CLIENTS) {
    console.log(
      `${client.id.padEnd(15)} ${detected.get(client.id) ? 'detected    ' : 'not detected'}  ${client.describeTarget()}`
    );
  }
}

// Entry point for `npx @runpod/mcp-server <add|remove> [flags]`. Resolves to
// the process exit code.
export async function runWizard(
  subcommand: string,
  argv: readonly string[] = process.argv.slice(3),
  isInteractive: boolean = Boolean(process.stdin.isTTY && process.stdout.isTTY)
): Promise<number> {
  const ids = CLIENTS.map((c) => c.id);
  const args = parseWizardArgs(argv, ids);
  if (args.errors.length) {
    for (const error of args.errors) console.error(`error: ${error}`);
    console.error(`\n${wizardUsage(ids)}`);
    return 2;
  }
  if (args.help) {
    console.log(wizardUsage(ids));
    return 0;
  }
  if (args.list) {
    await listClients();
    return 0;
  }
  if (args.clients) {
    return runNonInteractive(subcommand, args.clients, args.mode);
  }
  if (!isInteractive) {
    // Exiting 0 here is what let an agent report "configured" for a run that
    // wrote nothing. Say what happened and how to do it without prompts.
    console.error(
      `This installer needs an interactive terminal to show its prompts, and none is attached. Nothing was configured.\nTo run it without prompts, name the clients: npx @runpod/mcp-server@latest ${subcommand} --client <ids>\n\n${wizardUsage(ids)}`
    );
    return 2;
  }

  p.intro('Runpod MCP server installer');
  if (subcommand === 'remove') {
    await runRemove();
  } else {
    await runAdd();
  }
  return 0;
}
