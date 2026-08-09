# Refactor Shop-bandoan Code Safely

## Purpose

Improve readability, duplication, maintainability, or modularity while keeping
observable behavior unchanged.

## Use When

Use only when there is concrete duplication, an unclear boundary, or a
maintainability problem in the task-owned area. Do not use as opportunistic
cleanup during a feature or migration task.

## Repository Reference Points

- Auth separates session workflows, JWT operations, and cookie transport.
- Restaurants separates application rules from Prisma query/soft-delete policy.
- `common/` contains global decorators/filter/interceptor, not domain rules.
- `infrastructure/` owns technical lifecycle concerns, not business logic.

## Workflow

1. State the duplicated/unclear code and the behavior that must remain stable.
2. Confirm an existing service, repository, or shared utility is the correct
   target rather than creating a second abstraction.
3. Keep route paths, DTO fields, response envelopes, exception semantics, JWT
   claims, cookie attributes, and Prisma writes unchanged.
4. Add/adjust focused tests that prove preservation.
5. Review the diff for accidental formatter changes and run the relevant checks.

## Stop Conditions

Stop and ask for direction if the refactor would alter a schema, public API,
role policy, refresh-cookie contract, product ownership model, or data lifecycle.
