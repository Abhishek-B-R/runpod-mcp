// Flags for `npx @runpod/mcp-server <add|remove>`. Parsing is pure so the
// non-interactive contract is testable without a terminal.
//
// The wizard used to be prompts only. An agent shell has no TTY, so the
// multiselect drew once and the process exited 0 having written nothing, and
// the agent reported success. With `--client` the same install runs with no
// prompts at all; without it, a non-TTY run fails loudly instead.

export interface WizardArgs {
  help: boolean;
  list: boolean;
  // Client ids to configure, in the order given. Undefined means "ask".
  clients?: string[];
  // How to connect. Undefined means "ask" (interactive) or hosted (flags).
  mode?: 'hosted' | 'local';
  errors: string[];
}

export function parseWizardArgs(
  argv: readonly string[],
  knownIds: readonly string[]
): WizardArgs {
  const parsed: WizardArgs = { help: false, list: false, errors: [] };
  const addClients = (raw: string | undefined, flag: string) => {
    if (raw === undefined || raw.startsWith('-')) {
      parsed.errors.push(`${flag} needs a value, e.g. ${flag} cursor`);
      return;
    }
    for (const id of raw.split(',').map((s) => s.trim().toLowerCase())) {
      if (!id) continue;
      if (!knownIds.includes(id)) {
        parsed.errors.push(
          `unknown client "${id}". Supported: ${knownIds.join(', ')}`
        );
        continue;
      }
      parsed.clients ??= [];
      if (!parsed.clients.includes(id)) parsed.clients.push(id);
    }
  };
  const setMode = (mode: 'hosted' | 'local') => {
    if (parsed.mode && parsed.mode !== mode)
      parsed.errors.push('--hosted and --local cannot be combined');
    parsed.mode = mode;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') parsed.help = true;
    else if (arg === '--list') parsed.list = true;
    else if (arg === '--hosted') setMode('hosted');
    else if (arg === '--local') setMode('local');
    else if (arg === '--client' || arg === '-c') addClients(argv[++i], arg);
    else if (arg.startsWith('--client='))
      addClients(arg.slice('--client='.length), '--client');
    else parsed.errors.push(`unknown option "${arg}"`);
  }
  return parsed;
}

export function wizardUsage(knownIds: readonly string[]): string {
  return [
    'Usage:',
    '  npx @runpod/mcp-server@latest add                       interactive setup (needs a terminal)',
    '  npx @runpod/mcp-server@latest add --client <ids>        no prompts: configure these clients',
    '  npx @runpod/mcp-server@latest remove --client <ids>     no prompts: remove Runpod from them',
    '  npx @runpod/mcp-server@latest add --list                list clients, whether each is detected, and its config file',
    '',
    'Options:',
    `  -c, --client <ids>  comma-separated or repeated: ${knownIds.join(', ')}`,
    '  --hosted            connect to the hosted server and sign in with Runpod (OAuth); the default',
    '  --local             run the server locally with the API key in RUNPOD_API_KEY',
    '                      (read from the environment only, never from an argument)',
    '  -h, --help          show this help',
    '',
    'Exit codes: 0 configured, 1 a client failed, 2 bad usage or no terminal for prompts.',
  ].join('\n');
}
