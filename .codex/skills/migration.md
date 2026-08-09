# Create a Prisma Migration

## Purpose

Safely evolve Shop-bandoan's PostgreSQL schema and generated Prisma client.

## Use When

Use after a schema design decision requires a Prisma model, field, relation,
enum, constraint, index, or mapped-column change.

## Repository Facts

- Schema: `backend/prisma/schema.prisma`.
- Prisma config: `backend/prisma.config.ts`.
- Migrations: `backend/prisma/migrations/`.
- Generated client: `backend/generated/prisma`.
- Nest build copies generated assets into `backend/dist/generated`.
- Existing migration history includes the initial ecommerce schema and the
  `add_restaurants` migration.

## Workflow

1. Inspect existing models, migration history, and query callers.
2. Explain data, deployment-order, rollback/forward-fix, and compatibility risk.
3. Make the smallest additive schema change possible.
4. Create a descriptively named migration using the approved local development
   workflow; do not edit an applied migration.
5. Run `npx prisma format`, `npx prisma validate`, and `npx prisma generate`
   from `backend/`.
6. Inspect the generated SQL for destructive DDL, missing indexes, unintended
   defaults, incorrect mapped names, and relation behavior.
7. Update repository/service code and tests for the generated client changes.
8. Run lint, build, and relevant tests.

## Safety Gates

- Never use `prisma db push` as a replacement for migration history.
- Never use `migrate reset`, truncation, or destructive database commands on a
  shared environment without explicit approval of that environment.
- Never remove/rename models, tables, columns, or relations without a staged
  preservation plan.
- Do not commit generated Prisma output; it is ignored.

## Reporting

State the migration directory, data impact, generated-client update, rollback
or forward-fix option, and commands actually run.
