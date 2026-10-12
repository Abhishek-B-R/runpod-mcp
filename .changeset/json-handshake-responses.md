---
'@runpod/mcp-server': patch
---

Hosted server: every request except `tools/call` now answers as `application/json` instead of an SSE stream, so the CDN compresses it (`tools/list` drops from ~65 KB to ~13 KB on the wire per handshake). `tools/call` keeps SSE because clients read it under their long stream timeout and some tools hold a response longer than the JSON request timeout.

The per-request `mcp_request` log line is sampled (`MCP_REQUEST_LOG_SAMPLE_RATE`, default `0.1`; `MCP_VERBOSE_LOGS=true` logs all) and now records the response status, duration, JSON-RPC method (with tool name), the client's `initialize` name/version, user agent, and hashed caller key and address, so traffic can be attributed by client.
