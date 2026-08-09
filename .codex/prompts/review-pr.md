# Review a Shop-bandoan Change Set

```text
Perform a staff-level review of the current Shop-bandoan change set. Do not
modify code.

Read AGENTS.md and relevant docs. Start with git status and isolate task-owned
changes from pre-existing work. Inspect all changed backend source, Prisma
schema/migrations, tests, README/docs, package files, and docker-compose.yml
when present.

Review for correctness, breaking /api/v1 contract changes, response-envelope or
exception-filter bypasses, DTO/Swagger drift, default-private route mistakes,
JWT/refresh-cookie regressions, raw Prisma error exposure, migration/data loss,
soft-delete leakage, N+1/unbounded query risks, dependency/configuration impact,
test gaps, documentation gaps, and accidental generated/build files.

Return findings first, ranked by severity with file:line, impact, and smallest
safe fix. Then state assumptions, verification evidence, and a concise change
summary. Do not commit or push.
```
