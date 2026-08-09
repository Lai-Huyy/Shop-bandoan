# Implement a Shop-bandoan Feature

Use this prompt after replacing bracketed values with the actual domain and
requirement.

```text
Implement [feature] in Shop-bandoan.

Before editing, read AGENTS.md and relevant docs. Inspect the affected NestJS
module(s), backend/prisma/schema.prisma, existing tests, and git status.

Explain whether [feature] extends [existing module] or needs a new module. State
whether a Prisma change and repository are necessary, and identify API,
authorization, soft-delete/ownership, transaction, Swagger, documentation, and
compatibility effects.

List every file to create, modify, or remove. Then implement the smallest
cohesive solution using the controller → service → repository → PrismaService
pattern where query policy warrants a repository. Preserve the global /api/v1
prefix, JWT-private default, response envelope, exception filter, and DTO
validation conventions.

For public routes, use @Public() deliberately. For protected operations, apply
@Roles(...) and Swagger bearer metadata as appropriate. Add Swagger DTO and
error metadata. Add focused unit tests and route-level E2E coverage when the
existing test setup can exercise the contract.

Run from backend/: npx prisma validate (and generate for schema changes), npm
run lint, npm run build, npm test -- --runInBand, and npm run test:e2e --
--runInBand as applicable. Review the scoped git diff and report files changed,
architecture decisions, verification results, risks, and remaining TODOs.

Do not stage, commit, or push.
```
