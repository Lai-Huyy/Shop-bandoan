# Review a Shop-bandoan Feature

```text
Review the implementation of [feature] without modifying code.

Read AGENTS.md, relevant docs, the affected module, related Prisma models and
migrations, tests, and the scoped git diff. Compare the implementation with the
auth and restaurants patterns.

Review controller/service/repository boundaries; /api/v1 route compatibility;
global response/error envelopes; DTO validation; Swagger request/response/auth
metadata; default-private JWT/role policy; Prisma constraints, transactions,
indexes, Decimal use, and soft-delete/ownership filters; environment/security
behavior; test coverage; documentation synchronization; and migration safety.

Rank findings by severity and cite file:line. For each finding, state impact and
the smallest safe remediation. Then report what is sound, untested risks, and
whether lint/build/unit/E2E/Prisma checks were evidenced. Do not commit or push.
```
