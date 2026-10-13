---
'@runpod/mcp-server': patch
---

Hosted usage analytics now record which guide or concept was requested: the `id`, `concept`, `query`, `kind` and `limit` arguments of `list-guides`, `read-guide`, `lookup-concept` and `search-concepts`. `read-guide` events also carry `guide_kind` (skill, reference or golden-path). Guide resource reads (`resources/read`) are recorded as a new `runpod_mcp_resource_call` event with the guide URI, or `unknown` when nothing matched. Other tools still send no arguments, stdio still sends nothing, and `X-Runpod-Analytics: off` still opts out.
