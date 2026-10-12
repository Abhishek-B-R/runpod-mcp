---
'@runpod/mcp-server': patch
---

Generated tools no longer copy every OpenAPI field description into their input schemas. Only a curated set of one-line descriptions is served, for fields where the model would otherwise pick the wrong id, format, or behavior; types, enums, defaults and bounds are unchanged. `tools/list` drops from about 151 KB to about 98 KB.
