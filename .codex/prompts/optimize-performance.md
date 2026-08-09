# Optimize Shop-bandoan Performance

```text
Investigate and optimize [endpoint/query/workflow] in Shop-bandoan without
changing observable behavior unless explicitly approved.

Read AGENTS.md, relevant docs, the endpoint's controller/service/repository,
related Prisma models and indexes, and tests. Establish evidence first: query
shape, select/include use, pagination/order, soft-delete/ownership predicates,
transaction boundaries, Redis role, and available measurements/logs.

Explain the bottleneck hypothesis and alternatives. Prefer targeted Prisma
selects, deterministic pagination, eliminating N+1 access, appropriate indexes,
short transactions, or a defined Redis cache policy with key/TTL/invalidation
before adding infrastructure or dependencies. Preserve Decimal correctness,
authorization, response envelopes, and API compatibility.

List files to change, implement only the justified improvement, add regression
or performance-oriented tests where practical, run required checks, and report
measured/observed improvement plus remaining constraints. Do not commit or push.
```
