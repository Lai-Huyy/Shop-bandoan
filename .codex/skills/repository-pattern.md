# Apply the Restaurant Repository Pattern

## Purpose

Implement reusable persistence policy without leaking Prisma query construction
into controllers or duplicating it across services.

## Use When

Use this when a domain has more than a simple single-record lookup, particularly
for pagination, search, soft deletion, ownership visibility, deterministic
ordering, or repeated Prisma predicates.

## Reference Implementation

`backend/src/modules/restaurants/restaurants.repository.ts` is the repository
reference. It owns:

- active-record filtering with `deletedAt: null`;
- case-insensitive name/slug search;
- `skip`/`take` pagination and descending `createdAt` order;
- list plus count through a Prisma transaction;
- conditional update and soft-delete operations.

`RestaurantsService` owns pagination metadata, not-found exceptions, and
translation of Prisma `P2002` into a conflict exception.

## Implementation Pattern

1. Define a small options/result interface in the repository file.
2. Centralize the domain visibility predicate in a private method.
3. Return typed Prisma entities or deliberate mapped shapes.
4. Use `updateMany` when the mutation predicate must enforce active/owned state.
5. Return a count or nullable entity that the service can map to `NotFound`.
6. Keep controller code unaware of `where`, `include`, `orderBy`, or Prisma
   error codes.

## Avoid

- A repository that merely forwards every Prisma method without adding policy.
- Repeating soft-delete/ownership filters in services.
- Unordered pagination.
- Returning raw unique-constraint errors to API clients.
- Adding a repository to an auth-like workflow when a direct, tightly scoped
  Prisma transaction is clearer and no reusable query policy exists.

## Completion Signal

All read/count/update/delete query paths enforce the same domain visibility and
are covered by service tests for at least not-found and conflict/lifecycle cases.
