---
name: Generated client DOM iterable typing
description: Shared generated API client uses Headers.entries and needs iterable DOM typings.
---

The shared API client TypeScript project must include `dom.iterable` alongside `dom` when generated request helpers use `Headers.entries`.

**Why:** The generated client can compile successfully through codegen but fail the workspace declaration build if `Headers` lacks iterable typings.

**How to apply:** If a fresh generated client reports `Property 'entries' does not exist on type 'Headers'`, update the client library tsconfig rather than editing generated output.