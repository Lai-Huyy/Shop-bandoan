# Project context

## Purpose and status

Shop-bandoan is a full-stack ecommerce / online food-ordering application. The backend foundation provides authentication, health checks, restaurant discovery and administration, category discovery and administration, and administrator user management. The Next.js frontend foundation provides shared layout, authentication flow, typed API clients, and placeholder feature routes; most commerce workflows remain to be implemented.

## Repository layout

| Path | Current responsibility | State |
| --- | --- | --- |
| `backend/` | NestJS 11 REST API, Prisma ORM, implemented foundation modules and tests | Active |
| `frontend/` | Next.js 15 client foundation | Active |
| `docs/` | Project documentation | Created during this audit |
| `infrastructure/docker/` | Docker-related assets | Empty |
| `docker-compose.yml` | Local PostgreSQL 17 and Redis 7 services | Present |

The root Git repository has one initial commit. `backend/` is an independent nested Git repository whose `master` branch has no commits; it must be deliberately incorporated or managed as a submodule before shared delivery workflows are reliable.

## Backend architecture

The API uses NestJS with a modular layout. `AppModule` configures environment loading, Prisma, authentication, a global JWT guard, role guard, response-envelope interceptor, and exception filter. The auth module separates HTTP cookie handling, JWT token handling, and persisted user/session workflows. `main.ts` adds Helmet, CORS, request validation, the `/api/v1` prefix, and Swagger at `/api/docs`.

All unannotated routes require a bearer JWT. `@Public()` bypasses that guard; `@Roles()` works with the globally registered role guard. Successful responses are wrapped as `{ success, statusCode, message, timestamp, data }`; errors use a related JSON envelope.

Implemented public endpoints:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1` | Placeholder health-style response |
| `POST` | `/api/v1/auth/register` | Register a uniquely named customer, create their cart, issue access/refresh token pair |
| `POST` | `/api/v1/auth/login` | Verify username-or-email credentials and issue access/refresh token pair |
| `POST` | `/api/v1/auth/refresh` | Rotate an HTTP-only refresh-token session and issue a new access token |
| `POST` | `/api/v1/auth/logout` | Revoke the current refresh-token session and clear its cookie |
| `GET` | `/api/v1/users/me` | Return the current authenticated user's safe DTO |
| `GET` | `/api/v1/admin/users` | List users with deterministic newest-first pagination, text search, role, and account-status filters (admin only) |
| `GET` | `/api/v1/admin/users/:id` | Return a safe user profile, addresses, role, and supported order count (admin only) |
| `PATCH` | `/api/v1/admin/users/:id` | Update supported profile, role, or account-status fields; passwords are excluded (admin only) |
| `PATCH` | `/api/v1/admin/users/:id/status` | Update the account status using the existing `ACTIVE`, `SUSPENDED`, or `BANNED` enum (admin only) |
| `GET` | `/api/v1/health` | Check API, PostgreSQL, and Redis availability |
| `GET` | `/api/v1/restaurants` | Browse non-deleted restaurants with pagination and search |
| `GET` | `/api/v1/restaurants/:id` | View a non-deleted restaurant |
| `POST` | `/api/v1/restaurants` | Create a restaurant (admin only) |
| `PATCH` | `/api/v1/restaurants/:id` | Update a restaurant (admin only) |
| `DELETE` | `/api/v1/restaurants/:id` | Soft-delete a restaurant (admin only) |
| `GET` | `/api/v1/categories` | Browse visible categories with pagination and search |
| `GET` | `/api/v1/categories/:id` | View a visible category |
| `GET` | `/api/v1/categories/admin` | Browse all categories, including hidden entries (admin only) |
| `GET` | `/api/v1/categories/admin/:id` | View any category (admin only) |
| `POST` | `/api/v1/categories` | Create a category (admin only) |
| `PATCH` | `/api/v1/categories/:id` | Update a category (admin only) |
| `DELETE` | `/api/v1/categories/:id` | Hide a category from public discovery (admin only) |
| `GET` | `/api/v1/products` | Browse available products with category, price, text filters, pagination, and database sorting |
| `GET` | `/api/v1/products/:id` | View available product details, images, and options |
| `GET` | `/api/v1/products/admin` | Browse products in every availability state (admin only) |
| `POST` | `/api/v1/products` | Create a product with optional local image upload and options (admin only) |
| `PATCH` | `/api/v1/products/:id` | Update a product and optionally replace its primary image with a local JPEG, PNG, or WebP upload (admin only) |
| `DELETE` | `/api/v1/products/:id` | Permanently delete a product that has no order history; cart entries and cascading product data are removed (admin only) |
| `POST/PATCH/DELETE` | `/api/v1/products/:id/images[/imageId]` | Manage HTTPS image URLs (admin only) |
| `POST/PATCH/DELETE` | `/api/v1/products/:id/options[/optionId]` | Manage selectable product options (admin only) |
| `GET` | `/api/v1/cart` | Get the authenticated user's cart, item count, and decimal subtotal |
| `POST` | `/api/v1/cart/items` | Add an available product to the authenticated user's cart |
| `PATCH` | `/api/v1/cart/items/:itemId` | Update an authenticated user's cart-item quantity |
| `DELETE` | `/api/v1/cart/items/:itemId` | Remove an authenticated user's cart item |
| `POST` | `/api/v1/checkout` | Create a COD order from selected cart items or one direct product, preserving address and coupon snapshots |
| `GET` | `/api/v1/coupons/available` | List active coupons the current customer can claim |
| `POST` | `/api/v1/coupons/:id/claim` | Atomically claim a coupon once for the current customer |
| `GET` | `/api/v1/coupons/my` | List the current customer's claimed coupons and state |
| `POST` | `/api/v1/coupons/checkout-options` | Rank the customer's unused coupons against selected checkout items |
| `POST` | `/api/v1/coupons/preview` | Preview one owned, unused coupon against selected cart items or one direct product |
| `GET` | `/api/v1/coupons/analytics` | Coupon quantity, claim, and use totals (admin only) |
| `GET/POST/PATCH/DELETE` | `/api/v1/coupons[/id]` | Administrator coupon management; coupon quantity is total claim quantity and delete deactivates a coupon |
| `GET` | `/api/v1/orders` | List the current customer's orders with status filter, sorting, and pagination |
| `GET` | `/api/v1/orders/:id` | View an owned order, immutable shipping snapshot, payment, coupon, items, and status history |
| `POST` | `/api/v1/orders/:id/cancel` | Cancel an owned pending or confirmed order and preserve status history |
| `POST` | `/api/v1/orders/:id/buy-again` | Add all still-available ordered products and selected options to the current customer's cart |
| `GET` | `/api/v1/admin/orders` | List all orders with status/payment/date filters, search, sorting, and pagination (admin only) |
| `GET` | `/api/v1/admin/orders/summary` | Return real operational order counts and delivered revenue (admin only) |
| `GET` | `/api/v1/admin/orders/:id` | View the full operational order detail (admin only) |
| `PATCH` | `/api/v1/admin/orders/:id/status` | Advance or cancel an order only through its approved lifecycle (admin only) |

## Data architecture

Prisma targets PostgreSQL through `DATABASE_URL`, with generated client code in `backend/generated/prisma`. One initial migration defines an ecommerce-oriented schema: roles and users; addresses and sessions; catalog categories, products, images, and options; carts and coupons; orders, payments, and status history; reviews and a retained legacy wishlist table; notifications and audit logs. The wishlist table remains unchanged for data safety, but no application module or frontend route uses it.

The schema already anticipates Stripe, PayPal, VNPay, MoMo, COD, Redis-backed future capabilities, role-based administration, and auditability. Categories use their existing self-referencing hierarchy and hide behaviour through `isDisplayed`; no schema change or migration was required. Products remain global catalog items and reuse the existing `Product`, `ProductImage`, and `ProductOption` models: administrators can upload JPEG, PNG, or WebP product images to local development storage, while options are selectable values rather than stock-managed SKUs, and deletion changes the product status to `ARCHIVED`. Orders use immutable shipping snapshots, Decimal totals, Payment records, and append-only `OrderStatusLog` records. Authentication uses users, roles, carts, and `user_sessions`; users have unique usernames and emails, while refresh tokens are bcrypt-hashed and persisted for rotation and revocation. Authentication responses expose only the access token; the refresh token remains in the existing HTTP-only cookie. `npx prisma db seed` idempotently provisions the local administrator account after migrations.

Product inventory is tracked by additive `stockQuantity` and `soldQuantity`
counters. The Cart validates requested quantities for early feedback, but the
Checkout transaction is authoritative: it conditionally decrements every
product's stock alongside coupon redemption, immutable address snapshot, order,
payment, and purchased-cart-item deletion. A failed stock reservation rolls the
entire transaction back. Cancelling an eligible order restores its quantities in
the same state-transition transaction. Zero-stock products remain public so
customers can see them, but the API and frontend prevent purchasing them.

Coupon ownership is represented by the additive `coupon_claims` table. Its
unique `(coupon_id, user_id)` constraint lets a customer claim a coupon only
once; each record preserves `claimed_at`, nullable `used_at`, and the unique
order that consumed it. Claiming atomically reserves one total coupon quantity,
and Checkout marks the selected owned claim as used in the same transaction as
stock reservation, immutable order snapshots, COD payment creation, and cart
removal. A customer may retain at most ten claims. Existing `max_redemptions`
is retained as the stored total coupon quantity for API/data compatibility.

## Local operation

1. Start local dependencies from the repository root: `docker compose up -d`.
2. Copy `backend/.env.example` to `backend/.env`, then configure production-safe JWT/CORS settings.
3. From `backend/`, run `npx prisma migrate deploy`, then `npm run start:dev`.
4. Browse Swagger at `http://localhost:3000/api/docs`.

The frontend has its own package and development setup documented in `docs/frontend-architecture.md`. There is still no application Dockerfile or production deployment configuration. Docker Compose includes PostgreSQL and Redis health checks; the Nest production build copies the generated Prisma client into `dist`.
