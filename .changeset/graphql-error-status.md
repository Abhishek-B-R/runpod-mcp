---
'@runpod/mcp-server': patch
---

GraphQL errors that Runpod returns on an HTTP 200 now fail the tool call with a status taken from the error code (401, 403, 400, otherwise 502) instead of 200, so agents get the matching recovery hint. A non-array `errors` field no longer crashes the call.
