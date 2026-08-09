# Project audit

Audit date: 2026-07-27

## Verified findings

| Area | Result | Evidence |
| --- | --- | --- |
| Prisma schema | Pass | `npx prisma validate` completed successfully. |
| Backend unit tests | Pass | `npm test -- --runInBand`: 1 suite, 1 test passed. |
| Backend E2E tests | Pass | 1 suite, 1 test passed after aligning the expected response envelope. |
| Compose configuration | Pass | `docker compose config --quiet` completed successfully. |
| Running containers | Pass | PostgreSQL and Redis were recreated with health checks and both reported healthy. |
| PostgreSQL / Redis connectivity | Pass | `pg_isready`, `redis-cli ping`, Prisma migration status, and `/api/v1/health` all succeeded. |
| Frontend | Not started | `frontend/` contains no files. |
| Documentation | Incomplete before audit | Root README was only a title and stack description; the backend README remains the Nest starter template. |

## Completed work

- NestJS 11 application foundation, TypeScript configuration, ESLint, and Prettier configuration.
- Global security and API behavior: Helmet, CORS, `/api/v1` prefix, validation, Swagger, JWT guard, roles guard, response transformer, and exception filter.
- Customer registration, login, token refresh, and logout with bcrypt password hashes, persisted role checks, automatic cart creation, and rotating refresh-token sessions.
- PostgreSQL Prisma schema and initial migration for major ecommerce domains.
- Local PostgreSQL and Redis Compose services with persistent named volumes.
- Validated, typed configuration with production safeguards for the database URL, JWT secret, CORS origins, Redis, Swagger, and ports.
- Redis infrastructure service, PostgreSQL/Redis health endpoint, production startup logging, and Compose health checks.
- Corrected E2E response assertion, production entrypoint, and generated-Prisma build asset handling.

## Remaining work

- Build the Next.js frontend and its API integration.
- Implement catalog, category, cart, coupon, address, checkout, orders, payments, reviews, notification, and admin modules. The legacy wishlist database table is intentionally retained but is not an active product feature.
- Implement password recovery and email verification.
- Add authorization policies to operational endpoints as modules arrive, and establish seed data for required roles/admin users.
- Add test coverage for auth flows, security cases, persistence behavior, API envelopes, and all business modules.
- Provide Dockerfiles, CI, observability, backups, rate limiting, and production secrets management.

## Risks and recommended actions

| Severity | Risk | Recommended action |
| --- | --- | --- |
| Medium | Development defaults allow the API to run before a local JWT secret and CORS allowlist are set; production validation correctly rejects this state. | Require a generated secret and environment-specific origin in every deployed environment. |
| High | The root and backend are separate Git repositories; the backend has no commit, while the root sees it as an untracked nested repository. | Decide on monorepo versus submodule, commit the chosen structure, and protect the main branch. |
| Medium | Registration uses separate database writes without a transaction. A cart-creation failure can leave a user without a cart. | Wrap user and cart creation in a Prisma transaction. |
| Medium | Refresh-token sessions use HTTP-only cookies, so frontend cross-origin deployment must preserve the configured CORS allowlist and credentialed requests. | Configure production frontend origins and use `credentials: 'include'` for refresh/logout requests. |
| Medium | The E2E test imports `AppModule` directly, so it does not exercise bootstrapping configuration such as the API prefix and CORS. | Test through the production bootstrap path. |
| Medium | The schema uses application-generated UUID defaults. The raw initial SQL does not define database UUID defaults, so direct SQL inserts require IDs. | Decide whether database-side UUID generation is required and add it in a migration if so. |
| Medium | Redis is currently used only for connection and health verification. | Define the first business use case (rate limiting, queues, caching, or sessions). |
| Medium | Docker Compose has development credentials and exposes database/cache ports publicly; API/frontend containers are not defined. | Restrict exposure and credentials; add production-ready container definitions. |
| Low | Some unique fields also have redundant non-unique indexes (for example email, slug, code, and order number). | Review query plans and remove redundant indexes if they provide no value. |

## Infrastructure readiness

Local dependency definitions are verified: PostgreSQL 17 and Redis 7 have pinned major-version images, restart policies, named persistent volumes, and Docker health checks. Their containers report healthy, PostgreSQL accepts connections, Redis responds to `PING`, and the public application health endpoint verifies both dependencies. The application itself is not containerized and no CI/CD, monitoring, backup plan, or deployment manifest is present.
