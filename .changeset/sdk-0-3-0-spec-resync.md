---
'@runpod/mcp-server': minor
---

Resync the vendored v2 OpenAPI spec with production and update `@runpod/typescript-api-sdk` from 0.2.0 to 0.3.0 and `@runpod/plugin-knowledge` to 1.7.4. Adds the `list-global-volumes`, `get-global-volume`, `create-global-volume`, `update-global-volume`, `delete-global-volume` and `get-organization` tools, `global` mounts on `create-pod`, `mounts` on endpoints, and `pagination` on `list-clusters` and `list-network-volumes`. Those two list tools now return one page (default `limit` 1000); follow `pagination.nextCursor` until `hasNextPage` is false.

`tools/list` shrinks from 97 KB to 87 KB. `create-pod` is listed by its call shape, like `create-endpoint`; `describe-tool` serves its full schema. Tool annotations leave out `idempotentHint` when it is `false`, the MCP spec default. A description override on a composed schema is no longer repeated on each `allOf` member.
