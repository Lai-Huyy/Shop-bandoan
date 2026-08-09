# Audit a Shop-bandoan Module

```text
Audit backend/src/modules/[module] without modifying code.

Read AGENTS.md, relevant docs, the module's controller/service/repository/DTOs/
tests, related common and infrastructure code, relevant Prisma models and
migrations, and current git status.

Assess module cohesion, controller → service → repository boundaries, DI,
DTO validation/transformation, /api/v1 and global envelope behavior, Swagger,
public/private and role policy, exception mapping, sensitive output/logging,
Prisma relation/index/transaction use, pagination/search/soft-delete invariants,
unit and E2E coverage, docs synchronization, and maintainability.

Rank verified findings by severity. Cite file:line, explain repository-specific
impact, and recommend only scoped improvements. Do not implement, commit, or
push.
```
