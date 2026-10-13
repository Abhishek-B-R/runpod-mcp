---
'@runpod/mcp-server': patch
---

The hosted server now breaks 404 loops: once a signed-in caller gets 50 404s from one tool within 10 minutes, that tool answers that caller with a retryable 429 for 10 minutes. Counts live in the existing Convex sink, successful calls never touch it, and any sink failure lets calls through. Local (stdio) installs are unaffected.
