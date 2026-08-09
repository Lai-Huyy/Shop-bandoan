# Fix a Shop-bandoan Bug

```text
Fix [bug] in Shop-bandoan.

Read AGENTS.md and relevant docs. Inspect git status, the failing route/module,
related tests, global filter/interceptor/guards, Prisma models/migrations, and
configuration or Docker dependencies when relevant.

Reproduce the defect with a focused test or safe local request. Explain the
root cause across controller → service → repository/Prisma and any global API
behavior. List every file to change and explain why the proposed correction does
not alter unrelated /api/v1, DTO, JWT/cookie, soft-delete, or data behavior.

Implement the minimum fix and a regression test. Run Prisma validation/generation
for schema changes plus lint, build, unit tests, and E2E tests as applicable.
Review the scoped diff and report reproduction, cause, fix, verification, and
remaining risk. Do not commit or push.
```
