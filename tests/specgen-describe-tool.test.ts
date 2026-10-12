// The on-demand listing is only safe if three things hold together: the
// listing is shallow, describe-tool serves exactly the definition, and a call
// is still gated by the full schema.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createSpecgenServer } from '#src/specgen/server';
import { createToolContext } from '#src/specgen/context';
import { generatedTools } from '#src/specgen/generated/tools.gen';
import { DESCRIBE_TOOL_NAME } from '#src/specgen/on-demand';

async function connect() {
  const server = createSpecgenServer(
    createToolContext({ apiKey: 'rpa_test' }),
    'test'
  );
  const client = new Client({ name: 'test', version: '1' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(st), client.connect(ct)]);
  return client;
}

type Schema = Record<string, unknown>;
const payloadOf = (result: unknown) => {
  const { content } = result as { content?: { text?: string }[] };
  return JSON.parse(content?.[0]?.text ?? 'null');
};

test('a schemaOnDemand tool lists its call shape; describe-tool serves the definition', async () => {
  const client = await connect();
  const definition = generatedTools.find(
    (tool) => tool.name === 'create-endpoint'
  )!;
  assert.equal(definition.schemaOnDemand, true);

  const { tools } = await client.listTools();
  const listed = tools.find((tool) => tool.name === 'create-endpoint')!;
  const schema = listed.inputSchema as Schema;
  assert.deepEqual(Object.keys(schema.properties as Schema), ['body']);
  const body = (schema.properties as Record<string, Schema>).body;
  assert.equal(body.type, 'object');
  assert.equal(body.properties, undefined);
  assert.equal(schema.$defs, undefined);
  assert.match(
    listed.description ?? '',
    new RegExp(`${DESCRIBE_TOOL_NAME} for the full argument schema`)
  );

  const described = payloadOf(
    await client.callTool({
      name: DESCRIBE_TOOL_NAME,
      arguments: { name: 'create-endpoint' },
    })
  );
  assert.deepEqual(described.inputSchema, definition.inputSchema);
  assert.equal(described.description, definition.description);
  assert.deepEqual(described.annotations, definition.annotations);

  const plain = tools.find((tool) => tool.name === 'get-pod')!;
  assert.deepEqual(
    plain.inputSchema,
    generatedTools.find((tool) => tool.name === 'get-pod')!.inputSchema
  );
  await client.close();
});

test('describe-tool answers an unknown name with suggestions', async () => {
  const client = await connect();
  const result = await client.callTool({
    name: DESCRIBE_TOOL_NAME,
    arguments: { name: 'start-pod' },
  });
  assert.equal(result.isError, true);
  const payload = payloadOf(result);
  assert.ok(
    payload.suggestions.includes('pod-action'),
    JSON.stringify(payload)
  );
  await client.close();
});

test('a schemaOnDemand tool is still gated by its full schema and points at describe-tool', async () => {
  const client = await connect();
  const result = await client.callTool({
    name: 'create-endpoint',
    arguments: { name: 'x' },
  });
  assert.equal(result.isError, true);
  const payload = payloadOf(result);
  assert.match(payload.error, /Missing required argument: body/);
  assert.match(payload.hint, new RegExp(DESCRIBE_TOOL_NAME));
  await client.close();
});
