---
'@runpod/mcp-server': minor
---

New `search-docs` tool: searches Runpod documentation, curated support knowledge, the Runpod blog and runpod.io through the runpod-assistant knowledge index, and returns ranked passages with source URLs. The hosted server searches with its own service key and retries the index's capacity rejections with jittered backoff. Local installs call the hosted `POST /api/search` with the user's API key.
