---
'@runpod/mcp-server': patch
---

Hosted server: the request body is validated once with the SDK's JSON-RPC schemas; `prefersJsonResponse` and `summarizeRpc` take the parsed messages, and the log line reports a client name/version only for a spec-valid `initialize`.
