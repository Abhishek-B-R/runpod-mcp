---
'@runpod/mcp-server': patch
---

Hosted server: `tools/call` now answers as `application/json` too, so the CDN compresses tool results; only tools that hold their response open (`runsync-endpoint`, `get-job-status`, `stream-job`, `stream-pod-logs`, `stream-worker-logs`, `deploy-hub-repo`) keep SSE, declared with `CuratedTool.holdsResponse`.
