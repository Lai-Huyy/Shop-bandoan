# Refactor a Shop-bandoan Module

```text
Refactor backend/src/modules/[module] while preserving behavior.

Read AGENTS.md, related docs, the entire affected module, its tests, callers,
related Prisma models, and git status. Identify concrete duplication or a
maintainability/readability boundary problem before proposing changes.

Explain why the refactor is necessary and how it preserves controller routes,
DTOs, the /api/v1 envelope, Nest exceptions, Swagger, authorization, JWT/cookie
behavior where relevant, Prisma writes, and soft-delete rules. List every file
to change. Do not include unrelated cleanup.

Implement the smallest coherent refactor, adjust tests to prove preservation,
run lint/build/unit/E2E checks as applicable, review the scoped diff, and report
behavior preserved, verification results, and any risk. Do not commit or push.
```
