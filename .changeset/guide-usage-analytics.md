---
'@runpod/mcp-server': patch
---

Hosted usage analytics now record which guide or concept was requested: the `id`, `concept`, `query`, `kind` and `limit` arguments of `list-guides`, `read-guide`, `lookup-concept` and `search-concepts`. Guide resource requests (`resources/list`, `resources/templates/list`, `resources/read` with its URI) are recorded as a new `runpod_mcp_resource_call` event. Other tools still send no arguments, stdio still sends nothing, and `X-Runpod-Analytics: off` still opts out.
