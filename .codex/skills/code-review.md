# Review a Shop-bandoan Change

## Purpose

Review a scoped diff for correctness, compatibility, architecture, and delivery
quality before a user-approved commit.

## Use When

Use for a feature review, pull-request-style review, pre-commit review, or
handoff review. This skill is read-only unless remediation is requested.

## Review Order

1. Inspect `git status` and isolate the task-owned diff from existing work.
2. Identify module, route, schema, auth, configuration, and documentation impact.
3. Compare controller/service/repository responsibilities to restaurants/auth.
4. Check public API compatibility: `/api/v1`, DTOs, success envelope, errors,
   pagination, Swagger, and access decorators.
5. Check Prisma constraints, migration safety, transaction boundaries, `Decimal`,
   query select/include shape, indexes, and soft-delete filters.
6. Check security: DTO validation, role policy, output/log secrecy, CORS/config,
   JWT/cookie behavior.
7. Check tests and verification output against the changed behavior.
8. Check README/project-context/AGENTS impact when setup or architecture changed.

## Finding Format

Report findings first, ordered by severity:

```text
[severity] file:line — concise problem
Impact: repository-specific consequence
Recommendation: smallest safe correction
```

Then state residual risks, tests not run, and a brief change summary. Do not
invent findings when the diff is sound.
