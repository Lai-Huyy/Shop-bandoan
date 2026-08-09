# Test Shop-bandoan Backend Changes

## Purpose

Select the correct current test style and verify behavior without relying only
on compilation.

## Current Test Layout

- Unit specs are colocated under `backend/src/` as `*.spec.ts`.
- Service tests mock injected collaborators using Jest.
- `auth.service.spec.ts` verifies registration/cart/session, refresh rotation,
  and logout revocation.
- `health.service.spec.ts` verifies both healthy and dependency-failure paths.
- `restaurants.service.spec.ts` verifies pagination, duplicate slug, soft-delete
  visibility, and removal.
- The E2E suite is `backend/test/app.e2e-spec.ts`; it currently imports
  `AppModule` and asserts the global success envelope for `GET /`.

## Commands

Run from `backend/`:

```bash
npx prisma validate
npm run lint
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Run `npx prisma generate` after schema changes. The `lint` script uses `--fix`,
so inspect the resulting diff.

## Test Design

1. Unit-test service rules and collaborators without network/database access.
2. For repositories, test query policy through service tests or focused
   integration tests when a real database is introduced.
3. Add E2E tests for a route's global envelope, validation, public/private
   access, role policy, expected failure, and primary success path.
4. Use deterministic UUIDs/dates and close applications after E2E tests.
5. Do not treat the current root-route E2E test as coverage of bootstrap CORS,
   prefix, Swagger, or real PostgreSQL/Redis connectivity.

## Reporting

Report each command run, suite/test counts, and any intentional test limitation.
