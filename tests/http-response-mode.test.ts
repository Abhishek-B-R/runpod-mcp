import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'node:http';

import {
  handleMcpRequest,
  prefersJsonResponse,
  requestLogSampleRate,
  summarizeRpc,
} from '../src/http.js';

// ============== Response mode: JSON for the handshake, SSE for tool calls ==============
// The CDN compresses application/json and never text/event-stream, so every
// request that is not a tools/call answers as JSON. tools/call keeps SSE because
// clients read it under their long stream timeout and some tools hold a response
// for longer than the short JSON request timeout.

const init = (clientInfo?: { name: string; version?: string }) => ({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: clientInfo ?? { name: 'probe', version: '0' },
  },
});
const toolsList = { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} };
const toolsCall = (name: string) => ({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: { name, arguments: {} },
});
const initialized = { jsonrpc: '2.0', method: 'notifications/initialized' };

describe('prefersJsonResponse', () => {
  it('handshake and listing requests → JSON', () => {
    assert.equal(prefersJsonResponse(init()), true);
    assert.equal(prefersJsonResponse(toolsList), true);
    assert.equal(
      prefersJsonResponse({ jsonrpc: '2.0', id: 9, method: 'ping' }),
      true
    );
    assert.equal(prefersJsonResponse([init(), initialized]), true);
  });

  it('tools/call, alone or anywhere in a batch → SSE', () => {
    assert.equal(prefersJsonResponse(toolsCall('list-pods')), false);
    assert.equal(prefersJsonResponse([toolsList, toolsCall('x')]), false);
  });

  it("a body the handler never parsed keeps the SDK's SSE default", () => {
    assert.equal(prefersJsonResponse(undefined), false);
    assert.equal(prefersJsonResponse(null), false);
    assert.equal(prefersJsonResponse('junk'), false);
    assert.equal(prefersJsonResponse([]), false);
    assert.equal(prefersJsonResponse([toolsList, 'junk']), false);
  });
});

describe('summarizeRpc', () => {
  it('initialize → method plus the client name/version', () => {
    assert.deepEqual(
      summarizeRpc(init({ name: 'claude-code', version: '2.1' })),
      {
        rpc: 'initialize',
        client: 'claude-code/2.1',
      }
    );
    assert.deepEqual(summarizeRpc(init({ name: 'cursor' })), {
      rpc: 'initialize',
      client: 'cursor/unknown',
    });
  });

  it('tools/call carries the tool name; a batch is comma-joined', () => {
    assert.deepEqual(summarizeRpc(toolsCall('list-pods')), {
      rpc: 'tools/call:list-pods',
      client: undefined,
    });
    assert.equal(
      summarizeRpc([init(), initialized, toolsList]).rpc,
      'initialize,notifications/initialized,tools/list'
    );
  });

  it('response elements and non-MCP bodies', () => {
    assert.equal(
      summarizeRpc({ jsonrpc: '2.0', id: 1, result: {} }).rpc,
      'response'
    );
    assert.deepEqual(summarizeRpc(undefined), {});
    assert.deepEqual(summarizeRpc('junk'), {});
    assert.deepEqual(summarizeRpc([]), { rpc: undefined, client: undefined });
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
    },
    body,
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as IncomingMessage;

  const written: {
    statusCode?: number;
    headers?: Record<string, string>;
    chunks: string[];
  } = { chunks: [] };
  let finish!: () => void;
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const res = {
    statusCode: 200,
    writeHead(statusCode: number, hdrs?: Record<string, string>) {
      written.statusCode = statusCode;
      written.headers = hdrs ?? {};
      return this;
    },
    flushHeaders() {},
    write(chunk: string) {
      written.chunks.push(String(chunk));
      return true;
    },
    end(chunk?: string) {
      if (chunk !== undefined) written.chunks.push(String(chunk));
      finish();
    },
    on() {
      return this;
    },
  } as unknown as ServerResponse;

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
