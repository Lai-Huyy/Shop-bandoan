# Create a Shop-bandoan Module

## Purpose

Create a cohesive NestJS domain module that matches `auth`, `health`, and
`restaurants` without introducing a second application architecture.

## Use When

Use this for a new implemented domain such as `categories`, `products`, `cart`,
`orders`, `payments`, `coupons`, `reviews`, `notifications`, or administration.
Do not use it merely because a matching Prisma model already exists.

## Inspect First

- `backend/src/app.module.ts` for global providers and registration style.
- The closest domain module, especially `modules/restaurants/` for CRUD/query
  patterns and `modules/auth/` for security-sensitive composition.
- Relevant models and relations in `backend/prisma/schema.prisma`.
- `src/common/` decorators, filter, and interceptor.
- Existing tests under `src/modules/<domain>/` and `backend/test/`.

## Module Shape

Start with the smallest set of files justified by the domain:

```text
backend/src/modules/<domain>/
├── dto/
├── <domain>.module.ts
├── <domain>.controller.ts
├── <domain>.service.ts
└── <domain>.service.spec.ts
```

Add `<domain>.repository.ts` only when the domain has reusable Prisma query
policy: search, pagination, soft deletion, ownership filters, complex includes,
or multiple persistence operations. Restaurants are the current reference.

Add local `guards/`, `decorators/`, or `strategies/` only when their behavior is
owned by that module. Put genuinely cross-domain concerns in `src/common/`.

## Implementation Sequence

1. Decide whether the capability extends an existing module or needs a new one.
2. Identify whether the feature requires:
   - Prisma schema changes
   - a new Prisma migration
   - new DTOs
   - new authorization rules
   - new Swagger contracts

   If any of these are required, plan and coordinate those changes before writing implementation code.

3. Define the public API and access policy before service code. Routes are
   private by default because `JwtAuthGuard` is global.
4. Add input DTOs with validation and Swagger property metadata.
5. Implement controller methods as transport-only delegations to a service.
6. Implement service rules, expected exception mapping, and transactions.
7. Add repository policy when direct Prisma calls would duplicate filters or
   expose persistence details.
8. Register the module in `AppModule`.
9. Add focused unit tests and E2E coverage where the route contract changes.

## Module-Specific Checks

- Controller paths omit `/api/v1`; `main.ts` owns that prefix.
- Do not manually create success envelopes; `TransformInterceptor` owns them.
- Use `@Public()` only for deliberate anonymous discovery routes.
- Add `@Roles(...)` and `@ApiBearerAuth()` for protected operations.
- Expose response DTOs, not sensitive Prisma fields.
- Update Swagger and affected project-context/README documentation.

## Completion Signal

The module is registered, reachable through the global API conventions, tested,
and does not bypass the established controller → service → repository → Prisma
boundary.
