---
'@runpod/mcp-server': minor
---

Add `describe-tool`, which returns any tool's full definition, and list the tools with large request bodies (create/update endpoint, template and cluster, update-pod, create/update secret) with their call shape only: the top-level arguments with their types, nested objects collapsed. What each tool accepts is unchanged: the full schema still gates every call and is one `describe-tool` call away. Every client handshake carries about a quarter fewer bytes.
