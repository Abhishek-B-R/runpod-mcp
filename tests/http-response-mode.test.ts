import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { IncomingMessage, ServerResponse } from 'node:http';

import {
  bodyIsCheckable,
  handleMcpRequest,
  parseMcpMessages,
  prefersJsonResponse,
  requestLogSampleRate,
  summarizeRpc,
} from '#src/http';

// ============== Response mode: JSON for the handshake, SSE for tool calls ==============
// The CDN compresses application/json and never text/event-stream, so every
// request that is not a tools/call answers as JSON. tools/call keeps SSE because
// clients read it under their long stream timeout and some tools hold a response
// for longer than the short JSON request timeout.

const init = (
  clientInfo: Record<string, unknown> = { name: 'probe', version: '0' }
) => ({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo },
});
const toolsList = { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} };
const toolsCall = (name: string) => ({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: { name, arguments: {} },
});
const initialized = { jsonrpc: '2.0', method: 'notifications/initialized' };
const response = { jsonrpc: '2.0', id: 1, result: {} };

describe('parseMcpMessages', () => {
  it('keeps the elements the SDK would accept and drops the rest', () => {
    assert.equal(parseMcpMessages(toolsList).length, 1);
    assert.equal(parseMcpMessages([init(), initialized, response]).length, 3);
    // The SDK answers 400 for a batch with a junk element, so dropping it here
    // changes nothing a tool could observe; the valid request still gates.
    assert.equal(parseMcpMessages([toolsCall('x'), 'junk']).length, 1);
    assert.equal(bodyIsCheckable([toolsCall('x'), 'junk']), true);
  });

  it('absent, host-unparsed, or non-MCP bodies yield nothing', () => {
    for (const body of [
      undefined,
      null,
      'junk',
      42,
      {},
      [],
      { jsonrpc: '1.0', method: 'x' },
    ]) {
      assert.deepEqual(
        parseMcpMessages(body),
        [],
        `for ${JSON.stringify(body)}`
      );
    }
  });
});

describe('prefersJsonResponse', () => {
  const prefers = (body: unknown) =>
    prefersJsonResponse(parseMcpMessages(body));

  it('handshake, listing and ping requests → JSON', () => {
    assert.equal(prefers(init()), true);
    assert.equal(prefers(toolsList), true);
    assert.equal(prefers({ jsonrpc: '2.0', id: 9, method: 'ping' }), true);
    assert.equal(prefers([init(), initialized]), true);
  });

  it('a notification-only batch → JSON (the SDK answers it with an empty 202)', () => {
    assert.equal(prefers([initialized]), true);
  });

  it('tools/call, alone or anywhere in a batch → SSE', () => {
    assert.equal(prefers(toolsCall('list-pods')), false);
    assert.equal(prefers([toolsList, toolsCall('x')]), false);
  });

  it("no parsed messages keeps the SDK's SSE default", () => {
    assert.equal(prefers(undefined), false);
    assert.equal(prefers('junk'), false);
    assert.equal(prefers([]), false);
  });
});

describe('summarizeRpc', () => {
  const summarize = (body: unknown) => summarizeRpc(parseMcpMessages(body));

  it('initialize → method plus the client name/version', () => {
    assert.deepEqual(summarize(init({ name: 'claude-code', version: '2.1' })), {
      rpc: 'initialize',
      client: 'claude-code/2.1',
    });
  });

  it('an initialize the SDK would reject reports no client', () => {
    // clientInfo.version is required by the schema; a client omitting it never
    // completes the handshake, so there is no identity worth logging.
    assert.deepEqual(summarize(init({ name: 'cursor' })), {
      rpc: 'initialize',
      client: undefined,
    });
  });

  it('tools/call carries the tool name; a batch is comma-joined', () => {
    assert.deepEqual(summarize(toolsCall('list-pods')), {
      rpc: 'tools/call:list-pods',
      client: undefined,
    });
    assert.equal(
      summarize([init(), initialized, toolsList]).rpc,
      'initialize,notifications/initialized,tools/list'
    );
  });

  it('response elements and empty bodies', () => {
    assert.equal(summarize(response).rpc, 'response');
    assert.deepEqual(summarize(undefined), {
      rpc: undefined,
      client: undefined,
    });
    assert.deepEqual(summarize('junk'), { rpc: undefined, client: undefined });
  });
});

describe('requestLogSampleRate', () => {
  it('defaults to 10%; the env var overrides and is clamped to [0, 1]', () => {
    assert.equal(requestLogSampleRate({}), 0.1);
    assert.equal(
      requestLogSampleRate({ MCP_REQUEST_LOG_SAMPLE_RATE: '0.25' }),
      0.25
    );
    assert.equal(requestLogSampleRate({ MCP_REQUEST_LOG_SAMPLE_RATE: '0' }), 0);
    assert.equal(requestLogSampleRate({ MCP_REQUEST_LOG_SAMPLE_RATE: '7' }), 1);
    assert.equal(
      requestLogSampleRate({ MCP_REQUEST_LOG_SAMPLE_RATE: '-1' }),
      0
    );
  });

  it('garbage falls back to the default; verbose logs everything', () => {
    assert.equal(
      requestLogSampleRate({ MCP_REQUEST_LOG_SAMPLE_RATE: 'lots' }),
      0.1
    );
    assert.equal(
      requestLogSampleRate({ MCP_REQUEST_LOG_SAMPLE_RATE: '' }),
      0.1
    );
    assert.equal(
      requestLogSampleRate({
        MCP_VERBOSE_LOGS: 'true',
        MCP_REQUEST_LOG_SAMPLE_RATE: '0',
      }),
      1
    );
  });
});

// ---- handleMcpRequest end to end against the real SDK transport ----

interface Written {
  statusCode?: number;
  headers?: Record<string, string>;
  chunks: string[];
}

// Enough of ServerResponse for the SDK transport and the request log: headers,
// body writes, and the 'finish' event the log line waits for.
class FakeResponse extends EventEmitter {
  statusCode = 200;
  writableFinished = false;
  constructor(
    private readonly written: Written,
    private readonly finish: () => void
  ) {
    super();
  }
  writeHead(statusCode: number, hdrs?: Record<string, string>) {
    this.statusCode = statusCode;
    this.written.statusCode = statusCode;
    this.written.headers = { ...(this.written.headers ?? {}), ...(hdrs ?? {}) };
    return this;
  }
  setHeader(name: string, value: string | number | readonly string[]) {
    this.written.headers = {
      ...(this.written.headers ?? {}),
      [name]: String(value),
    };
    return this;
  }
  flushHeaders() {}
  write(chunk: string) {
    this.written.chunks.push(String(chunk));
    return true;
  }
  end(chunk?: string) {
    if (chunk !== undefined) this.written.chunks.push(String(chunk));
    this.writableFinished = true;
    this.emit('finish');
    this.finish();
  }
}

function fakeReqRes(body: unknown) {
  const req = {
    method: 'POST',
    url: '/',
    headers: {
      host: 'mcp.test',
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      authorization: 'Bearer rpa_x',
      'user-agent': 'probe/0',
      'x-real-ip': '203.0.113.9',
    },
    body,
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as IncomingMessage;

  const written: Written = { chunks: [] };
  let finish!: () => void;
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const res = new FakeResponse(written, finish) as unknown as ServerResponse;
  return { req, res, written, finished };
}

const validCredential = async () => ({ status: 'valid' as const });

describe('handleMcpRequest — response mode', () => {
  it('tools/list answers application/json with the full tool list', async () => {
    const { req, res, written, finished } = fakeReqRes(toolsList);
    await handleMcpRequest(req, res, { verifyCredential: validCredential });
    await finished;
    assert.equal(written.statusCode, 200);
    assert.equal(written.headers?.['Content-Type'], 'application/json');
    const parsed = JSON.parse(written.chunks.join('')) as {
      id: number;
      result: { tools: Array<{ name: string }> };
    };
    assert.equal(parsed.id, 2);
    assert.ok(parsed.result.tools.length > 10);
  });

  it('initialize answers application/json', async () => {
    const { req, res, written, finished } = fakeReqRes(init());
    await handleMcpRequest(req, res, { verifyCredential: validCredential });
    await finished;
    assert.equal(written.headers?.['Content-Type'], 'application/json');
    const parsed = JSON.parse(written.chunks.join('')) as {
      id: number;
      result: { serverInfo: { name: string } };
    };
    assert.equal(parsed.id, 1);
    assert.ok(parsed.result.serverInfo.name);
  });

  it('tools/call stays on text/event-stream', async () => {
    // An unknown tool errors inside the server, so no outbound call is made and
    // the transport still has to deliver the error on the stream.
    const { req, res, written, finished } = fakeReqRes(
      toolsCall('no-such-tool')
    );
    await handleMcpRequest(req, res, { verifyCredential: validCredential });
    await finished;
    assert.equal(written.statusCode, 200);
    assert.equal(written.headers?.['Content-Type'], 'text/event-stream');
    const stream = written.chunks.join('');
    assert.match(stream, /^event: message\ndata: /m);
    assert.match(stream, /no-such-tool/);
  });
});

// ---- the mcp_request log line ----

interface RequestLogLine {
  method?: string;
  status?: number;
  durationMs?: number;
  rpc?: string;
  client?: string;
  ua?: string;
  caller?: string;
  ip?: string;
  sampleRate?: number;
}

// Forces full sampling and captures only mcp_request lines, restoring both after.
async function captureRequestLog(
  run: () => Promise<void>
): Promise<RequestLogLine[]> {
  const previousRate = process.env.MCP_REQUEST_LOG_SAMPLE_RATE;
  process.env.MCP_REQUEST_LOG_SAMPLE_RATE = '1';
  const original = console.log;
  const lines: RequestLogLine[] = [];
  console.log = (...args: unknown[]) => {
    if (args[0] === 'mcp_request') lines.push(args[1] as RequestLogLine);
    else original(...args);
  };
  try {
    await run();
  } finally {
    console.log = original;
    if (previousRate === undefined)
      delete process.env.MCP_REQUEST_LOG_SAMPLE_RATE;
    else process.env.MCP_REQUEST_LOG_SAMPLE_RATE = previousRate;
  }
  return lines;
}

describe('mcp_request log line', () => {
  it('carries what was asked and by whom, never the raw key or address', async () => {
    const lines = await captureRequestLog(async () => {
      const { req, res, finished } = fakeReqRes(toolsList);
      await handleMcpRequest(req, res, { verifyCredential: validCredential });
      await finished;
    });
    assert.equal(lines.length, 1);
    const line = lines[0];
    assert.equal(line.method, 'POST');
    assert.equal(line.status, 200);
    assert.equal(line.rpc, 'tools/list');
    assert.equal(line.ua, 'probe/0');
    assert.equal(line.sampleRate, 1);
    assert.equal(typeof line.durationMs, 'number');
    assert.match(line.caller ?? '', /^[0-9a-f]{12}$/);
    assert.match(line.ip ?? '', /^[0-9a-f]{12}$/);
    const serialized = JSON.stringify(line);
    assert.doesNotMatch(serialized, /rpa_x/);
    assert.doesNotMatch(serialized, /203\.0\.113\.9/);
  });

  it('a rejected credential still logs the attempted method', async () => {
    const lines = await captureRequestLog(async () => {
      const { req, res, finished } = fakeReqRes(toolsList);
      await handleMcpRequest(req, res, {
        verifyCredential: async () => ({
          status: 'invalid' as const,
          reason: 'revoked',
        }),
      });
      await finished;
    });
    assert.equal(lines.length, 1);
    assert.equal(lines[0].status, 401);
    assert.equal(lines[0].rpc, 'tools/list');
  });
});
