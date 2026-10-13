---
'@runpod/mcp-server': patch
---

Accept the argument shapes strict-schema clients send. Clients such as Codex
and opencode must send every property, so an optional query filter they mean
to leave out arrives as `null`, `""` or `[]`. Those are now treated as omitted:
`cudaVersions: []` next to `minCudaVersion` on `get-gpu-type` and
`list-gpu-types`, `lastN: null` next to an explicit range on the billing tools,
and `cursor: ""` on a first page no longer fail upstream. Numbers and booleans
a client stringified inside a request body (`disk: "20"`, `workers.max: "1"`)
are converted back where the body schema asks for one; string fields stay
strings.

A 400 hint now names the upstream cause instead of always saying "Input shape
mismatch": no capacity for the requested hardware, no account balance, or two
conflicting arguments. Real validation failures (a 422, or field errors) keep
the shape hint.
