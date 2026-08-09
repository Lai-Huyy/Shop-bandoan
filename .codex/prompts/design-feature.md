# Design a Shop-bandoan Feature

```text
Design [feature] for Shop-bandoan without modifying code.

Read AGENTS.md, all relevant docs, backend/prisma/schema.prisma, the closest
existing module (auth, health, or restaurants), backend/src/app.module.ts, and
the current tests. Inspect git status but do not alter existing work.

Answer explicitly:
- Which existing module/service owns part of the problem?
- Should [feature] extend it or become a new module?
- Is a Prisma model, field, relation, enum, index, or migration truly needed?
- Does the persistence policy require a repository like RestaurantRepository?
- What new coupling, authorization, transaction, soft-delete/ownership, API,
  data-migration, and compatibility risks are introduced?

Propose routes beneath /api/v1, DTOs, response data inside the global envelope,
access policy, expected Swagger metadata, exception behavior, test plan, exact
file plan, documentation impact, and migration/rollback strategy when relevant.

Do not invent restaurant-product ownership, a frontend application, payment
behavior, or a database relation that is not supported by an approved rule.
Do not implement, commit, or push.
```
