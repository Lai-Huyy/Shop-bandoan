# Design Prisma Changes for Shop-bandoan

## Purpose

Evaluate whether the existing ecommerce schema should be extended before a
module or migration is created.

## Use When

Use this before adding a Prisma model, field, relation, enum value, unique
constraint, index, ownership rule, or soft-delete lifecycle.

## Existing Schema Context

`backend/prisma/schema.prisma` already models users/roles/sessions, categories,
products/options/images, carts/coupons, orders/payments/status logs, reviews,
wishlists, notifications, audit logs, and restaurants. Most future domain
names therefore already have a data model but not an API module.

The client is generated to `backend/generated/prisma`, not the default location.
Database columns use snake_case through `@map`, while TypeScript fields use
camelCase. Financial values use `Decimal`.

## Design Questions

1. Can the requirement use an existing model, relation, status enum, or audit
   record without changing schema semantics?
2. Is the missing concept a true aggregate, or merely a field/query on an
   existing aggregate?
3. What is the ownership model: customer, administrator, restaurant, or system?
4. What foreign-key and deletion behavior preserves order history and security?
5. Which query path proves the need for a unique constraint or index?
6. Does the record require hard delete, a `deletedAt` lifecycle like restaurants,
   or immutable preservation like order snapshots?
7. Can old and new application versions operate during migration deployment?

## Design Rules

- Use additive schema evolution whenever possible.
- Do not invent a restaurant-to-product relationship until ownership/menu rules
  are approved; the current schema does not define one.
- Keep monetary values as `Decimal` from schema through service calculation.
- Add relational constraints rather than relying on application checks alone.
- Avoid duplicate indexes for unique columns unless query evidence justifies it.
- Keep external provider payloads as controlled JSON and never return raw values.

## Output

Before editing, report the selected model boundary, relation/deletion policy,
data compatibility risk, required migration, and affected API/service modules.
