# Coding standards

These standards extend the existing NestJS, TypeScript, ESLint, Prettier, Prisma, and Jest setup.

## General

- Use TypeScript for application and test code; keep names explicit and domain-oriented.
- Follow the repository formatter: single quotes and trailing commas. Run formatting and linting before review; do not use `lint --fix` without reviewing its changes.
- Keep modules cohesive. Place controllers, services, DTOs, guards, and strategies under the owning domain in `src/modules/`; keep cross-cutting concerns in `src/common/` and technical adapters in `src/infrastructure/`.
- Do not introduce `any` unless a boundary truly requires it; narrow external values as soon as possible.
- Never commit secrets, `.env` files, generated Prisma clients, build output, or local database volumes.

## NestJS API conventions

- Version public routes beneath the configured `/api/v1` prefix.
- New routes are private by default. Apply `@Public()` only where anonymous access is intentional; apply `@Roles()` for role-restricted operations.
- Validate every input with DTOs and `class-validator` decorators. Design DTOs to work with the global whitelist, reject unknown fields, and transform enabled in `main.ts`.
- Use NestJS HTTP exceptions for expected errors. Let the global exception filter preserve the standard error contract.
- Return domain data from controllers/services rather than manually creating response envelopes; the global interceptor owns successful response formatting.
- Add Swagger tags, operation summaries, input metadata, and useful response descriptions to every public endpoint.
- Do not expose password hashes, refresh tokens, provider secrets, or raw payment payloads in API responses or logs.

## Database and Prisma conventions

- Change the Prisma schema and create a reviewed migration together. Do not edit an applied migration.
- Use transactions for multi-record business operations that must succeed or fail together.
- Store money as Prisma `Decimal` and never use JavaScript floating-point arithmetic for order totals or discounts.
- Preserve immutable order snapshots for names, prices, and selected options at checkout.
- Add database constraints and indexes based on access patterns; avoid redundant indexes where a unique constraint already provides the same index.
- Seed stable system data such as roles via a repeatable, versioned seed process rather than request-time creation where practical.

## Security and configuration

- Treat `JWT_SECRET`, database URLs, payment credentials, and CORS origins as required environment configuration in production. Do not provide insecure production fallbacks.
- Use an explicit CORS origin allowlist when credentials are enabled.
- Hash passwords using bcrypt and a maintained cost factor. Implement token rotation, revocation, and expiry validation before adding refresh tokens.
- Validate payment-provider callbacks cryptographically and make webhook processing idempotent.
- Record high-value state transitions in audit logs without storing secrets or excessive personal data.

## Testing and delivery

- Add unit tests for services and guards, plus E2E tests for each route’s authentication, validation, authorization, envelope, and error behavior.
- E2E tests must assert the actual global response contract and should boot the application with production-equivalent configuration where feasible.
- Keep tests deterministic: use isolated test data/database setup and clean up resources after each test.
- Before merge, run Prisma validation, unit tests, E2E tests, type/build checks, and linting. A known failing test blocks the release until it is corrected or explicitly quarantined with an owner and deadline.

