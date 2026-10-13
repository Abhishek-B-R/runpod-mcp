---
'@runpod/mcp-server': minor
---

The installer runs without prompts and supports opencode and Pi.
`npx @runpod/mcp-server@latest add --client <ids>` configures the named clients
with no prompts (`--hosted` by default, `--local` to read the key from
`RUNPOD_API_KEY`), `remove --client <ids>` undoes it, and `add --list` shows
which clients are detected and where each config lives. Run with no
`--client` and no terminal, the installer now exits 2 and says nothing was
configured, instead of exiting 0 having written nothing. Exit codes: 0
configured, 1 a client failed, 2 bad usage. `--help` and `--version` work at
the top level and on `add`/`remove`.

New clients: opencode (`~/.config/opencode/opencode.json`, or an existing
`opencode.jsonc`, under `mcp` with opencode's `remote`/`local` entry schema)
and Pi (`~/.pi/agent/mcp.json`, honouring `PI_CODING_AGENT_DIR`). Both config
formats were checked by running opencode 1.19.0 and Pi 1.2.0 against the files
the installer writes.
