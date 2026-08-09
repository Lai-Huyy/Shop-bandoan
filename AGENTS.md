# Shop-bandoan Agent Guide

This document is the operating guide for people and AI agents working in this
repository. It describes the repository as it exists today, not a generic
NestJS or Next.js starter. Follow it together with the task request and the
documents in `docs/`.

## Project Overview

Shop-bandoan is a backend-first online food-ordering and ecommerce platform.

The current product foundation is a NestJS REST API backed by PostgreSQL and
Redis. It already provides:

- application configuration and production validation;
- PostgreSQL access through Prisma;
- Redis connectivity and a dependency health check;
- JWT access-token authentication and rotating refresh-token sessions;
- role-based authorization;
- Swagger/OpenAPI documentation;
- restaurant discovery and administrator-managed restaurants;
- global request validation, response transformation, and error handling.

The Next.js frontend is planned but has not been initialized. The `frontend/`
directory is intentionally empty and has no `package.json`, source tree,
build script, or dependency lockfile.

The project should grow into a production-quality food-ordering system with
catalog, cart, checkout, orders, payments, reviews, notifications, and
administration. It is not yet a complete ecommerce application.

### Current Scope

- Treat `backend/` as the active application.
- Treat `docker-compose.yml` as local dependency infrastructure only.
- Treat `frontend/` as a planned workspace, not an existing client.
- Treat `infrastructure/docker/` as reserved for future Docker assets.
- Do not claim a feature is implemented merely because its Prisma model exists.

Why: the Prisma schema anticipates many future domains, while the NestJS
modules currently implement only authentication, health, and restaurants.

## Repository Structure

```text
Shop-bandoan/
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── docs/
│   ├── coding-standards.md
│   ├── project-audit.md
│   └── project-context.md
├── backend/
│   ├── src/
│   │   ├── common/
│   │   ├── config/
│   │   ├── infrastructure/
│   │   └── modules/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── test/
│   ├── generated/prisma/       # generated; ignored by Git
│   ├── package.json
│   ├── prisma.config.ts
│   ├── nest-cli.json
│   └── tsconfig.json
├── frontend/                   # currently empty
└── infrastructure/docker/      # currently empty
```

### Root Files

- `README.md` is the public project entry point and local setup reference.
- `docker-compose.yml` starts PostgreSQL 17 and Redis 7 for local work.
- `AGENTS.md` is the repository-specific delivery guide for agents.
- `.gitignore` excludes runtime output, environment files, and dependencies.

### Backend Layout

- `src/common/` contains cross-cutting decorators, the global exception filter,
  and the global response interceptor.
- `src/config/` maps environment variables and validates startup configuration.
- `src/infrastructure/` contains technical adapters: Prisma and Redis.
- `src/modules/` contains domain modules and their HTTP boundaries.
- `src/modules/auth/` owns registration, login, logout, JWTs, sessions, and
  authorization guards.
- `src/modules/health/` owns the public PostgreSQL/Redis health endpoint.
- `src/modules/restaurants/` owns restaurant DTOs, controller, service, and
  repository.
- `prisma/schema.prisma` is the database contract.
- `prisma/migrations/` is the immutable migration history.
- `test/` contains the current Jest E2E configuration and application test.

### Managed Tooling References

`backend/.agents/`, `backend/.claude/`, and `backend/.windsurf/` contain
mirrored Prisma skill reference material. `backend/skills-lock.json` records
their sources and hashes.

- Do not modify these mirrors as part of application work.
- If a task explicitly updates managed skills, keep all three mirrors aligned.
- Do not copy skill reference code blindly into the application.

Why: divergence between the mirrored tool references creates inconsistent
guidance for different coding agents, while application behavior belongs in
`backend/src/` and `backend/prisma/`.

## Technology Stack

### Backend

- Node.js with TypeScript targeting ES2023.
- NestJS 11 for the REST API and dependency injection.
- Prisma ORM 6 for PostgreSQL access and migrations.
- PostgreSQL 17 as the relational data store.
- Redis 7 Alpine through `ioredis` for connectivity and future caching/queues.
- Passport JWT and `@nestjs/jwt` for bearer-token authentication.
- bcrypt for password and refresh-token hashing.
- `class-validator` and `class-transformer` for HTTP input validation.
- Swagger through `@nestjs/swagger`.
- Helmet, CORS, and `cookie-parser` for HTTP security and refresh cookies.

### Tooling

- TypeScript 5.7 with `module` and `moduleResolution` set to `nodenext`.
- ESLint 9 with `typescript-eslint` and Prettier integration.
- Prettier 3 with single quotes and trailing commas.
- Jest 30, `ts-jest`, Supertest, and `@nestjs/testing`.
- Docker Compose for local PostgreSQL and Redis.

### Frontend

- The intended stack is Next.js, React, TypeScript, and Tailwind CSS.
- No frontend application has been bootstrapped yet.
- There are no frontend scripts to run today.

Why: agents must not invent an existing frontend architecture, dependencies,
or commands. Establish those deliberately when the frontend is created.

## Dependency Management Rules

- Before adding a package, check `backend/package.json` and NestJS/Prisma built-ins; explain the capability gap, maintenance/license/security cost, and why it is better than a small local implementation.
- Prefer the existing stack over parallel libraries, keep test tooling in `devDependencies`, update `package-lock.json`, and document configuration.
- Do not add packages for one-line helpers or unapproved frontend decisions.

Why: unnecessary packages enlarge the security patch surface and upgrade burden.

## Architecture

### Architectural Style

The backend uses a pragmatic Clean Architecture / modular NestJS design:

1. Controllers own HTTP transport concerns.
2. Services own application rules and orchestration.
3. Repositories own domain-specific Prisma query construction.
4. Infrastructure services own database and cache connectivity.
5. DTOs define and validate external input/output contracts.
6. Shared cross-cutting behavior belongs in `src/common/`.

Keep dependencies pointing inward:

```text
Controller → Service → Repository → PrismaService
                 ↓
          domain/infrastructure collaborators
```

Controllers may depend on services. Services may depend on repositories and
well-defined technical collaborators. Repositories may depend on
`PrismaService`. Do not make controllers call Prisma directly.

Why: this keeps request handling, business policy, and persistence policy
testable independently and prevents large all-purpose services.

### Application Bootstrap

`src/main.ts` is the production bootstrap path. It:

- creates `AppModule` with buffered logs;
- configures Nest logging from validated configuration;
- enables Helmet and cookie parsing;
- enables credentialed CORS with the configured origin allowlist;
- adds the `/api/v1` global prefix;
- installs the global `ValidationPipe`;
- enables Swagger at `/api/docs` when configured;
- enables graceful shutdown hooks.

`AppModule` is responsible for global providers:

- `JwtAuthGuard` as the default authentication guard;
- `RolesGuard` as the role authorization guard;
- `TransformInterceptor` for success envelopes;
- `GlobalExceptionFilter` for error envelopes.

Why: do not reconfigure these behaviors inside individual feature modules.
Doing so would create inconsistent API behavior across routes.

### Existing Domain Boundaries

#### Authentication

`AuthService` owns user registration, password verification, persisted session
creation, refresh rotation, logout revocation, and user mapping.

`AuthTokenService` owns JWT signing, refresh-token verification, and refresh
expiry decoding.

`AuthCookieService` owns the `refresh_token` HTTP-only cookie contract.

Why: JWT cryptography, cookie transport, and session persistence change for
different reasons and are intentionally separated.

#### Restaurants

`RestaurantRepository` is the sole Prisma-facing implementation for the
restaurant domain.

`RestaurantsService` owns duplicate-slug translation, not-found behavior, and
pagination metadata.

The restaurant module uses soft deletion through `deletedAt`. Normal reads,
updates, and deletes must target `deletedAt: null` records only.

Why: a soft-deleted restaurant must not accidentally reappear through a new
query path. The repository centralizes that invariant.

#### Health

`HealthService` checks PostgreSQL using Prisma and Redis using `RedisService`.

Why: the endpoint reports actual dependency availability rather than merely
proving that the HTTP process is alive.

## Architecture Decision Rules

Before writing a feature plan, the AI must answer these questions explicitly:

1. Does an existing module or service already own the problem, or does it justify a new module, Prisma model, or relation?
2. Is a repository required by query policy or persistence invariants, and would the design increase coupling, transactions, authorization scope, dependencies, or API compatibility risk?

State the answers and selected boundary before implementation; prefer extending
the owning module unless the new domain has cohesive routes, DTOs, and lifecycle.

Why: future schema entities do not by themselves justify APIs or new boundaries.

## Future Module Guidelines

Future `categories`, `products`, `cart`, `orders`, `payments`, `coupons`,
`reviews`, `notifications`, and `administration` modules must follow the same
controller → service → repository → PrismaService pattern used by restaurants.

- Keep DTOs, tests, Swagger, authorization, and persistence logic in the owning module; reserve `common/` for cross-domain behavior and `infrastructure/` for technical adapters.
- Do not introduce a second architecture, generic CRUD layer, or controller-to-
  Prisma shortcut.

Why: consistent seams prevent shared services and controllers becoming hubs.

## Development Workflow

### Before Starting Work

1. Read this file completely.
2. Read all relevant files in `docs/`.
3. Inspect the affected module, its tests, and its Prisma models.
4. Inspect `git status` before changing anything.
5. Identify pre-existing changes and preserve them.
6. Explain the implementation plan to the requester.
7. List every file expected to be created, modified, or removed.
8. Ask for clarification when a missing business rule changes the design.

Why: this is a developing backend with staged and untracked work possible in
the same workspace. Blind edits can overwrite user work or invent domain rules.

### During Implementation

1. Make the smallest coherent change that satisfies the task.
2. Keep module boundaries intact.
3. Add or update tests with behavior changes.
4. Update Swagger for every public endpoint change.
5. Update project documentation when architecture, routes, setup, or status
   changes.
6. Review the diff before running any formatter that may rewrite files.

### Before Hand-off

1. Run the relevant validation, lint, build, and test commands.
2. Fix all newly introduced failures.
3. Inspect the final scoped `git diff` and `git status`.
4. State exactly what was verified and what was not.
5. Do not commit, push, or stage files unless explicitly instructed.

## Definition of Done

A task is complete only when its agreed scope is implemented and the following applicable conditions are true:

- Implementation, error paths, authorization, and persistence behavior are complete; no placeholder logic, unexplained TODO, `console.log`, debugger, or dead code remains.
- Applicable lint, build, Prisma validation/generation, unit/E2E tests, Swagger, DTOs, `/api/v1` contract, README, and docs updates are complete.
- The scoped diff, migration impact, generated-file status, final `git status`, and any explicit follow-up risk are reviewed; commit waits for user approval.

Why: a build alone does not prove an API contract or migration is hand-off safe.

## Coding Standards

### TypeScript

- Use TypeScript for all application and test code.
- Use explicit, domain-oriented names: `RestaurantsService`, not `Service`.
- Prefer `interface` for transport/repository contracts and `class` for Nest
  providers and DTOs.
- Keep functions focused; extract named private methods when a workflow has
  distinct validation, mapping, or persistence steps.
- Avoid `any`; use `unknown` at external boundaries and narrow it safely.
- Use `import type` for type-only Express imports where appropriate.
- Use async/await for asynchronous application code.
- Do not suppress TypeScript errors with unsafe casts or `@ts-ignore`.

Why: the current compiler enables `strictNullChecks`, and the generated Prisma
types are a key source of correctness. Avoiding weak types preserves that value.

### Formatting and Linting

- Match the repository Prettier style: single quotes and trailing commas.
- Keep import order readable and group related imports consistently.
- Run Prettier before review when formatting changed.
- The current `npm run lint` script invokes ESLint with `--fix`.
- Inspect its diff after running it, because it can modify files.
- Do not use lint auto-fixes as a substitute for reviewing the code.

Why: the lint script is intentionally mutating, so an unreviewed run can alter
unrelated files in a dirty worktree.

### Naming

- Use PascalCase for classes, DTOs, modules, and injected services.
- Use camelCase for variables, methods, DTO fields, and Prisma model fields.
- Use kebab-case filenames such as `restaurants.service.ts`.
- Use plural module directory names for collection domains, such as
  `modules/restaurants/`.
- Use domain terminology from the schema and API; do not introduce ambiguous
  aliases for existing entities.

### Comments

- Write comments for non-obvious decisions, invariants, or security behavior.
- Do not comment obvious syntax.
- Keep comments accurate when refactoring.

## Refactoring Rules

- Never refactor unrelated code while delivering a feature, migration, or bug
  fix.
- Refactor only for real duplication, readability, or maintainability gains when preserved behavior can be verified; explain the problem and boundary before editing, and use a separate authorized commit when reviewable.
- Preserve routes, DTOs, JWT claims, cookie settings, data, and envelopes unless an explicit compatibility change is approved.

Why: broad cleanup across auth seams can break security-sensitive behavior.

## Backend (NestJS) Guidelines

### Module Design

- Put each business capability under `backend/src/modules/<domain>/`.
- Create a `<domain>.module.ts` to declare its controllers and providers.
- Register the module in `AppModule`.
- Keep DTOs in `dto/`, guards in `guards/`, strategies in `strategies/`, and
  request decorators in `decorators/` beneath the owning module when local.
- Put reusable, cross-domain decorators and filters under `src/common/`.
- Put technical adapters under `src/infrastructure/`, not in a business module.

Why: the existing auth and restaurants modules establish the intended layout.
Following it avoids a flat `src/` directory and accidental cross-domain coupling.

### Controllers

- Controllers define routes, parameter extraction, DTO binding, and Swagger
  metadata; they do not implement business rules or Prisma queries.
- Prefix routes only with the module path, for example `@Controller('auth')`.
  `main.ts` already adds `/api/v1`.
- Use `@Param(..., ParseUUIDPipe)` for UUID identifiers.
- Use DTOs for body and query data; do not accept untyped request objects.
- Return service/domain data. Do not manually wrap success responses.
- Use `@Res({ passthrough: true })` only for necessary HTTP concerns such as
  the auth refresh cookie.

Why: the global interceptor owns the successful response shape, while the
global filter owns errors. Manual envelopes cause double wrapping or drift.

### Services

- Make services injectable and receive collaborators through constructor
  injection.
- Keep user-facing exception mapping in services, close to business intent.
- Translate expected Prisma unique errors into domain HTTP exceptions.
- Use transactions for multi-write operations that must be atomic.
- Keep side effects explicit and test them through injected collaborators.
- Never access `process.env` directly in a service; use `ConfigService`.

Why: `AuthService` uses a transaction for user/cart creation and uses injected
token/configuration collaborators. Preserve this testable orchestration style.

### Repositories

- Add a repository when a domain has non-trivial query policies or will have
  multiple persistence operations.
- Keep Prisma filtering, ordering, pagination, and soft-delete predicates in
  the repository.
- Return typed Prisma entities or explicitly mapped domain shapes.
- Do not leak raw Prisma errors to controllers or API clients.
- Apply a soft-delete predicate to every applicable query path.

Why: `RestaurantRepository` centralizes `deletedAt: null` filtering and the
search/pagination query shape. New domains with similar invariants should do
the same.

### Dependency Injection

- Provide services once in their owning module.
- Export providers only when another module needs them.
- Do not create providers with `new` inside application code.
- Preserve `PrismaModule` as the global database provider.
- Import `RedisModule` only in modules that use Redis directly.

Why: Nest manages provider lifecycle; bypassing it breaks tests, configuration,
and graceful shutdown.

### Logging

- Use Nest's `Logger` with the owning class name.
- Log operational failures with useful context but never secrets or tokens.
- Do not log passwords, refresh tokens, authorization headers, or raw payment
  provider payloads.
- Let unexpected errors reach the global filter after logging relevant context.

Why: startup, Prisma, Redis, health, and bootstrap logging already use Nest's
logger and must remain safe for production log aggregation.

## Frontend (Next.js) Guidelines

### Current State

There is no frontend implementation, manifest, or build system in this
repository today.

- Do not run `npm install`, `npm run build`, or lint commands in `frontend/`
  until a frontend `package.json` exists.
- Do not create placeholder pages or configuration as unrelated backend work.
- Do not assume the Next.js App Router, Pages Router, state library, or UI
  component library without an approved frontend decision.

Why: inventing a frontend baseline would create an unreviewed product and
deployment decision outside the backend-first scope.

### When Frontend Work Is Approved

- Use TypeScript, Next.js, React, and Tailwind CSS as the project intent.
- Create a dedicated frontend `package.json`, lint configuration, test plan,
  and README updates in the initial frontend task.
- Keep API client code typed and aligned with the `/api/v1` response envelope.
- Send bearer access tokens through the approved client strategy only.
- Refresh/logout requests must preserve the HTTP-only cookie contract and use
  credentialed requests when the frontend is cross-origin.
- Do not expose server-only environment variables to browser bundles.
- Document the chosen rendering, state, authentication, and error-handling
  architecture before building feature pages.

## Prisma Guidelines

### Schema and Client

- The Prisma schema is `backend/prisma/schema.prisma`.
- The provider is PostgreSQL and the client output is `backend/generated/prisma`.
- Import generated types and `PrismaClient` from `backend/generated/prisma`.
- Never hand-edit generated Prisma client files.
- Run `npx prisma generate` after schema changes.
- Do not commit `backend/generated/prisma`; it is ignored and copied into
  `dist/generated` by `nest-cli.json` during builds.

Why: the project uses a custom Prisma client output path, so imports and build
asset handling differ from projects using the default `@prisma/client` output.

### Migrations

- Change `schema.prisma` and add a new migration in the same task.
- Name migrations descriptively and keep their chronological directory names.
- Never edit an applied migration.
- Use `npx prisma migrate dev --name <description>` for local development
  migrations when a development database is available.
- Use `npx prisma migrate deploy` for applying reviewed migrations.
- Do not use `prisma db push` against shared, test, staging, or production
  databases as a substitute for a migration.
- Run `npx prisma validate` before hand-off.

Why: the repository already has an initial ecommerce migration and a separate
restaurant migration. Migration history is a deployment contract, not scratch
SQL.

## Database Safety Rules

- Never delete/rename Prisma models or tables, remove columns, or change relations/cascades without explaining data loss, locks, deployment order, and application compatibility impact.
- Preserve data with additive staged migrations; backfill and enforce required constraints separately when live data may exist.
- Review every migration, state rollback or forward-fix strategy and old/new API compatibility, and never reset/truncate/seed a shared database without approval of the exact environment and target data.

Why: migrations can outlive a failed deploy and must protect users and orders.

### Data Modeling

- Use `@map` for snake_case database columns while retaining camelCase in
  TypeScript and Prisma.
- Use `@db.Uuid` and application UUID defaults where established by the schema.
- Use `Decimal` for money and never use JavaScript floating-point arithmetic
  for prices, discounts, shipping, or totals.
- Use PostgreSQL `Json` only when a structured relational model is not needed.
- Define foreign-key deletion behavior deliberately.
- Add indexes for demonstrated query paths, not by habit.
- Do not duplicate a unique constraint with an identical single-column index
  without evidence that it is necessary.

Why: the current schema has financial totals, immutable order snapshots, and
many relation constraints. Careless schema changes can corrupt commerce data.

### Transactions and Concurrency

- Use interactive transactions for workflows with dependent writes.
- Use an array transaction for independent writes that should commit together.
- Keep transactions short and avoid network calls within them.
- Use conditional updates when preventing races, as auth refresh rotation does.
- Map known Prisma errors (`P2002`, `P2025`, and relevant FK errors) to clear
  domain exceptions rather than leaking database details.

Why: refresh-token rotation already uses a hash condition in `updateMany` to
prevent replay. Future checkout and inventory logic require the same care.

### Soft Deletion

- Use soft deletion only when the domain needs recovery/auditability.
- Add a nullable deletion timestamp, not a hard delete, when preserving records.
- Ensure every normal read, update, count, search, and relation query excludes
  soft-deleted records unless an explicit administration/audit use case says
  otherwise.
- Add indexes that match the active-record access pattern.

Why: restaurants use `deletedAt` and an index on `(deletedAt, createdAt)`.
Any new path that omits the predicate can expose deleted records.

## API Design Rules

### Routing and Versioning

- All API routes live beneath `/api/v1`, configured globally in `main.ts`.
- Controller decorators use only their resource segment.
- Use plural nouns for collection resources: `restaurants`, `orders`,
  `categories`.
- Use HTTP methods consistently: `POST` create, `GET` read, `PATCH` partial
  update, and `DELETE` delete/soft-delete.
- Do not introduce unversioned routes.

Why: the version prefix is a compatibility boundary for future frontend and
mobile clients.

### Authentication and Authorization

- Every route is private by default because `JwtAuthGuard` is global.
- Add `@Public()` only after deliberately deciding anonymous access is safe.
- Use `@Roles('ADMIN')` or other explicit role metadata for privileged actions.
- Add `@ApiBearerAuth()` to bearer-protected Swagger operations.
- Use `@ApiCookieAuth('refresh_token')` for refresh-cookie operations.

Why: a missing decorator should fail closed. The restaurant module intentionally
makes discovery public and administration `ADMIN`-only.

### Response Contract

Successful responses are transformed globally to:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "timestamp": "2026-07-27T00:00:00.000Z",
  "data": {}
}
```

Error responses are formatted globally with `success`, `statusCode`, `message`,
`errors`, `path`, and `timestamp`.

- Controllers and services return data, not the outer envelope.
- Use Nest exceptions for expected failures.
- Keep response DTOs free of private values such as hashes or tokens.
- Preserve compatible response shapes when changing existing endpoints.

Why: clients depend on one envelope format; duplicated controller envelopes
would be transformed a second time or become inconsistent.

### Pagination and Search

- Use DTO-validated `page` and `limit` query parameters.
- Default to page `1` and a documented limit.
- Bound limits to prevent expensive unbounded reads; restaurants use `100`.
- Return item data and explicit pagination metadata.
- Apply a deterministic `orderBy` to paginated queries.
- Sanitize and bound text search input.

Why: the restaurant list uses `skip`, `take`, a descending creation date, and
validated case-insensitive search. Future list endpoints should be predictable
and protect database capacity.

### Swagger

- Add `@ApiTags()` to every controller.
- Add `@ApiOperation()` summaries that describe the business action.
- Document request DTO properties with `@ApiProperty` or `@ApiPropertyOptional`.
- Document route parameters, security requirements, successful results, and
  important failures.
- Keep Swagger types aligned with nullable database fields and actual responses.
- Verify Swagger is available at `/api/docs` when `SWAGGER_ENABLED=true`.

Why: Swagger is an active API contract for the future frontend and integrators,
not decorative metadata.

## Security Rules

### Secrets and Configuration

- Never commit `.env` files, access tokens, JWT secrets, database credentials,
  payment credentials, or private keys.
- Keep `backend/.env.example` non-secret and up to date when configuration
  changes.
- Read configuration through `ConfigService`, not `process.env`, outside the
  configuration layer.
- Preserve production startup validation for database URLs, JWT secret length,
  explicit CORS origins, ports, bcrypt rounds, and booleans.
- Do not add insecure production fallback values.

Why: `validateEnvironment` deliberately permits development defaults but rejects
missing/weak JWT secrets and wildcard CORS in production.

### Authentication

- Store passwords and refresh tokens only as bcrypt hashes.
- Never return a password hash or refresh token in JSON.
- Issue access tokens as bearer credentials and refresh tokens through the
  HTTP-only `refresh_token` cookie.
- Preserve refresh-token rotation, revocation, expiration validation, and
  conditional update behavior.
- Keep the refresh cookie path `/api/v1/auth` unless a coordinated client and
  security change is approved.
- Preserve `httpOnly`, `sameSite: 'lax'`, and production-only `secure` settings
  unless an explicit cross-site security design replaces them.

Why: changing cookie scope or exposing refresh tokens weakens session security
and can break the future frontend authentication flow.

### Input and Output Safety

- Validate all external input.
- Never interpolate user input into raw SQL.
- Prefer Prisma query APIs; use tagged Prisma raw queries only when required.
- Never log authorization headers, cookies, passwords, refresh tokens, or raw
  payment provider payloads.
- Restrict CORS to approved origins whenever credentials are enabled.
- Apply authorization before actions that mutate data or reveal private records.

### Payments and Auditing

- Store money as Prisma `Decimal`.
- Validate payment webhooks cryptographically before changing order state.
- Make provider webhook handling idempotent.
- Preserve immutable order snapshots at checkout.
- Record high-value state transitions in `AuditLog` without recording secrets or
  unnecessary personal data.

Why: the schema already contains orders, payments, status logs, and audit logs.
Future implementation must preserve financial integrity from the first route.

## Error Handling

- Throw Nest HTTP exceptions for expected failures.
- Use `BadRequestException` for validly parsed but unacceptable requests.
- Use `UnauthorizedException` for missing, invalid, expired, or inactive auth.
- Use `ForbiddenException` for authenticated users lacking permissions.
- Use `NotFoundException` when an active requested resource does not exist.
- Use `ConflictException` for unique business conflicts such as email or slug.
- Let unexpected exceptions reach `GlobalExceptionFilter` after safe logging.
- Do not catch errors only to discard diagnostic context.
- Do not expose database error strings, stack traces, secrets, or implementation
  details to the API response.

Why: `GlobalExceptionFilter` supplies the project error contract and logs
unexpected errors. Local ad-hoc response shapes would break client handling.

## Validation Rules

- Use classes in a module's `dto/` directory for every body and query input.
- Use `class-validator` decorators for type, requiredness, range, format, and
  length constraints.
- Use `class-transformer` deliberately for values such as numeric query params
  and trimmed string inputs.
- Respect the global `ValidationPipe` configuration: `whitelist`,
  `forbidNonWhitelisted`, and `transform` are all enabled.
- Use `ParseUUIDPipe` for UUID route parameters.
- Use `PartialType(CreateDto)` for conventional PATCH DTOs, then add domain
  validation where an empty or invalid state must be rejected.
- Keep DTO optionality aligned with the public API, not merely a database field.
- Do not accept database entity types directly as request input.

Why: unknown properties are intentionally rejected and query transformations are
enabled globally. DTOs are both a security boundary and API documentation.

## Docker Rules

### Current Compose Scope

`docker-compose.yml` defines only local dependencies:

- PostgreSQL 17 as `shop_postgres` on host port `5432`;
- Redis 7 Alpine as `shop_redis` on host port `6379`;
- named persistent volumes `postgres_data` and `redis_data`;
- Docker health checks for both services.

There is no backend Dockerfile, frontend Dockerfile, API Compose service, or
production deployment configuration.

### Rules

- Use `docker compose up -d` from the repository root for local dependencies.
- Use the documented development credentials only for local Compose work.
- Do not treat exposed `5432` and `6379` as production-safe defaults.
- Do not remove named volumes or run destructive Compose commands without clear
  approval and confirmation of the target environment.
- Validate Compose changes with `docker compose config --quiet`.
- Add health checks and explicit dependency configuration to new services.
- Keep production containerization as a separate, reviewed task.

Why: the current Compose file exposes development services and credentials for
convenience. Production needs secrets management, restricted networking,
application images, observability, and deployment manifests.

## Git Workflow

### Working Tree Safety

- Begin with `git status --short`.
- Treat staged, unstaged, and untracked changes as user-owned unless the task
  clearly identifies them.
- Do not reset, checkout, clean, force-push, or delete files to make a clean
  working tree.
- Do not stage unrelated files.
- Inspect only the scoped diff before hand-off.
- Preserve existing migration history and generated-file ignore rules.

Why: this repository may contain in-progress staged backend and documentation
work. A feature task must coexist safely with that work.

### Commit and Push Authority

- Never commit automatically.
- Never push automatically.
- Never merge automatically.
- Commit only after the user explicitly approves the final diff and asks for a
  commit.
- Push only after the user explicitly asks to push.
- Before a requested commit, rerun the required checks and show `git status`.

Why: commits and pushes create shared, durable state. They require explicit
human authorization even after successful local verification.

## Conventional Commit Rules

Use Conventional Commits when a commit is authorized.

```text
<type>(<scope>): <imperative summary>
```

### Allowed Types

- `feat`: a user-visible capability.
- `fix`: a defect correction.
- `refactor`: behavior-preserving structural change.
- `docs`: documentation-only change.
- `test`: tests only.
- `chore`: maintenance, tooling, or dependency work.
- `build`: build or packaging changes.
- `ci`: continuous integration changes.
- `perf`: measured performance improvement.
- `security`: security hardening or remediation.

### Project Scopes

- `auth`
- `restaurants`
- `health`
- `infrastructure`
- `prisma`
- `api`
- `docs`
- `frontend`
- `docker`

Examples:

```text
feat(restaurants): add paginated public discovery
fix(auth): reject expired refresh sessions
refactor(infrastructure): isolate Redis connection lifecycle
docs(api): document response envelope
```

- Use an imperative, concise summary.
- Do not use vague messages such as `update code` or `fix stuff`.
- Keep one commit focused on one coherent change.

Why: focused history is important while the application is gaining many modules
and database migrations.

## Build & Test Checklist

### Backend Commands

Run commands from `backend/` unless stated otherwise.

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Use `npx prisma generate` after any schema change. It is not required for a
documentation-only change.

### Required Checks by Change Type

| Change type | Required checks |
| --- | --- |
| Documentation only | Markdown review and scoped `git diff` |
| TypeScript application code | `npm run lint`, `npm run build`, unit tests |
| Controller/API behavior | Lint, build, unit tests, E2E tests, Swagger review |
| Prisma schema/migration | `prisma validate`, `prisma generate`, build, relevant tests |
| Docker Compose | `docker compose config --quiet` and relevant connectivity checks |
| Authentication/security | All backend checks plus focused negative-path tests |

### Test Expectations

- Unit tests are colocated with source as `*.spec.ts` under `src/`.
- The Jest unit configuration uses `rootDir: src` and `ts-jest`.
- E2E tests live under `backend/test/` and use `test/jest-e2e.json`.
- Current E2E coverage is limited and imports `AppModule` directly.
- Add route tests for authentication, authorization, validation, response
  envelope, expected errors, and the principal happy path.
- Keep tests deterministic; mock infrastructure in unit tests and use isolated
  data for integration tests.
- Close Nest applications and database/cache resources created by E2E tests.

Why: current tests establish the response envelope and service behavior, but
feature coverage is still growing. New endpoints must not rely on manual tests.

### Build Output

- `nest build` writes compiled output to `backend/dist/`.
- `nest-cli.json` copies generated Prisma files into `dist/generated`.
- Do not commit `dist/`, coverage reports, `node_modules/`, or generated Prisma
  client output.

Why: production startup uses `node dist/src/main.js`, which requires generated
Prisma runtime assets to be present in the build output.

## Documentation Rules

- Read relevant `docs/` files before implementation.
- Update `README.md` when local setup, commands, externally visible features,
  or supported routes change.
- Update `docs/project-context.md` when architecture, implemented modules, API
  routes, data design, or current status changes.
- Update `docs/project-audit.md` only when recording a new verified audit result
  or resolving a documented risk; do not rewrite historical findings casually.
- Update `docs/coding-standards.md` only for cross-project development rules.
- Keep `AGENTS.md` aligned with actual repository structure and scripts.
- Do not claim the frontend, Dockerized API, CI/CD, payments, or catalog APIs
  exist until they are implemented and verified.
- Use concise Markdown headings, tables, and code blocks where they improve
  navigation.

Why: the root README and project context are the hand-off surface for the next
engineer. Stale status documentation causes incorrect implementation decisions.

## Documentation Synchronization

At planning time, identify the documentation impact and include the required
updates in the same task:

| Change | Documentation to assess |
| --- | --- |
| API, validation, or authorization | `README.md`, project context, Swagger |
| Prisma schema/migration | Project context; audit when a recorded risk changes |
| Auth, cookies, or environment | `README.md`, `.env.example`, project context |
| Module/architecture or build/Docker setup | `AGENTS.md`, `README.md`, project context |

Why: the repository has separate public setup, project-context, audit, and agent
guides. Updating only one produces contradictory instructions for the next task.

## Performance Guidelines

- Select only fields needed by the use case; do not eagerly include relations.
- Avoid N+1 queries by designing relation loading deliberately.
- Paginate all collection endpoints and impose a maximum limit.
- Add deterministic ordering to paginated queries.
- Use transactions only for atomic database work and keep them short.
- Do not perform remote HTTP calls inside database transactions.
- Use Redis only after defining cache keys, invalidation, TTL, failure behavior,
  and a measurable benefit.
- Add database indexes based on access patterns and inspect query plans for
  high-volume endpoints.
- Preserve Prisma `Decimal` values through financial calculations.
- Design cursor pagination before offset pagination becomes expensive for very
  large collections.

Why: Redis is currently used only for connectivity and health checks, while the
restaurant list currently uses offset pagination. Scaling decisions must be
deliberate rather than speculative.

## AI Agent Behaviour

### Required Behaviour

1. Read `AGENTS.md` and relevant `docs/` before every task.
2. Inspect the affected code, tests, configuration, and schema before editing.
3. State the intended architecture and why it fits existing boundaries.
4. List every file to be changed before making code changes.
5. Make explicit, conservative assumptions only when they do not create a new
   business policy.
6. Ask for direction when a missing requirement materially changes data model,
   authorization, payment, ownership, lifecycle, or deletion semantics.
7. Use repository tooling and existing patterns rather than introducing a new
   framework or abstraction without need.
8. Run proportionate verification and report concrete results.
9. Preserve unrelated user changes in the working tree.
10. Never commit, push, merge, reset, or delete broadly without explicit user
    authorization.

### Communication Expectations

- Lead with the outcome, then explain important implementation decisions.
- Be concise but name assumptions, risks, and verification limits.
- Separate completed work from proposed follow-up work.
- Do not claim tests, Docker connectivity, migrations, or deployments succeeded
  unless they were actually run in the current task.
- When a command can mutate the working tree, state that risk and review its
  scoped result.
- When work requires a destructive database action, identify the exact target
  and request approval before proceeding.

### Prohibited Shortcuts

- Do not bypass DTO validation with `@Body() body: any`.
- Do not put business rules in controllers.
- Do not call Prisma directly from controllers.
- Do not hardcode secrets, role identities beyond explicit policy, URLs, or
  environment-specific values.
- Do not return raw Prisma entities when they contain sensitive fields.
- Do not weaken the global guards, CORS, validation pipe, filters, or response
  envelope to make an endpoint easier to implement.
- Do not use `prisma db push` to avoid creating a reviewed migration.
- Do not initialize the frontend as an incidental side effect of backend work.

Why: agents can act quickly across many files. These constraints preserve the
security and architectural choices already established by the backend.

## Repository Evolution

- Preserve `/api/v1` routes, DTO fields, JWT claims, cookie behavior, and data through additive extensions where possible.
- Before an unavoidable break, explain clients, migration order, compatibility period, docs, and deprecation/forward-fix path; avoid debt by extending proven modules and recording deliberate deferrals with ownership.
- Revisit this guide, project context, audit, tests, and dependencies as modules, deployment assets, and the frontend mature.

Why: extension-oriented changes protect clients as this becomes multi-domain.

## Repository Goals

### Product Goals

- Deliver a trustworthy food-ordering platform with a clear customer journey.
- Support catalog discovery, carts, coupons, checkout, order tracking, and
  payment integrations without compromising financial correctness.
- Support role-aware administration and operational auditability.
- Provide a typed Next.js client once the frontend architecture is approved.

### Engineering Goals

- Keep the backend modular, testable, and observable.
- Preserve a stable versioned REST contract under `/api/v1`.
- Maintain safe authentication, session rotation, and authorization defaults.
- Keep PostgreSQL schema evolution migration-driven and reviewable.
- Grow test coverage with each business module.
- Add production Docker images, CI/CD, monitoring, backups, rate limiting, and
  secrets management as dedicated infrastructure work.

### Near-Term Priorities

1. Define restaurant ownership and product-to-restaurant relationships before
   implementing restaurant menus or multi-vendor ordering.
2. Implement catalog, category, address, cart, coupon, checkout, order,
   payment, review, wishlist, notification, and administration modules.
3. Add repeatable role/admin seed data rather than relying on request-time role
   creation indefinitely.
4. Expand unit and E2E coverage to the real bootstrap path and all API contracts.
5. Decide the frontend architecture and initialize it as a separate reviewed
   milestone.

## Quick Command Reference

### Local Dependencies

```bash
# repository root
docker compose up -d
docker compose config --quiet
```

### Backend Development

```bash
# backend/
npx prisma migrate deploy
npm run start:dev
```

### API URLs

```text
API base:  http://localhost:3000/api/v1
Swagger:   http://localhost:3000/api/docs
Health:    http://localhost:3000/api/v1/health
```

### Verification

```bash
# backend/
npx prisma validate
npm run lint
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Keep this guide current whenever repository structure, scripts, runtime
configuration, API conventions, or implementation status changes.
