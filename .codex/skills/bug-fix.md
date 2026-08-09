# Fix a Shop-bandoan Bug

## Purpose

Correct a verified defect with the smallest safe change while preserving the
existing API, auth, database, and response-envelope contracts.

## Use When

Use for unexpected route behavior, exception mapping, JWT/session behavior,
Prisma query bugs, Redis/health failures, validation defects, or Swagger drift.

## Workflow

1. Read the error report and identify the affected route/module/model.
2. Reproduce with a focused unit test, E2E test, or safe local request before
   editing whenever feasible.
3. Trace controller → service → repository/Prisma and global filter/interceptor
   behavior; do not diagnose only from the visible envelope.
4. Determine whether the defect is logic, input validation, authorization,
   configuration, migration/data state, or infrastructure connectivity.
5. Implement the smallest correction; do not bundle unrelated refactoring.
6. Add a regression test that fails before the fix and passes after it.
7. Run the relevant full command set and inspect the scoped diff.

## Bug-Specific Checks

- Preserve public `/api/v1` route and DTO compatibility.
- Preserve `deletedAt: null` policy for restaurant visibility.
- Preserve auth refresh rotation and cookie clearing behavior.
- Map known Prisma errors to the standard exception envelope.
- Do not “fix” a local dependency issue by changing production defaults.

## Report

State reproduction evidence, root cause, changed behavior, regression coverage,
commands run, and any unverified external dependency.
