# Shop-bandoan

Backend-first foundation for a full-stack ecommerce / online food-ordering application using Next.js (planned), NestJS 11, Prisma 6, PostgreSQL 17, and Redis 7.

## Current status

The NestJS backend includes authentication, health checks, restaurant management, and category management. The Next.js frontend foundation includes the shared layout and authentication flow. Product, cart, checkout, order, and other commerce workflows remain under development. See the documentation for architecture, audit findings, standards, and planned work:

- [Project context](docs/project-context.md)
- [Project audit](docs/project-audit.md)
- [Coding standards](docs/coding-standards.md)

## Local backend setup

```bash
# Start PostgreSQL and Redis from the repository root
docker compose up -d

# Configure and start the API
cd backend
# Copy .env.example to .env, then set secure and distinct JWT_SECRET and JWT_REFRESH_SECRET values before production
npx prisma migrate deploy
npm run start:dev
```

The API is served under `http://localhost:3000/api/v1`; Swagger is available at `http://localhost:3000/api/docs`.
The public health endpoint is available at `GET http://localhost:3000/api/v1/health` and checks PostgreSQL and Redis connectivity.

Authentication endpoints issue a short-lived bearer access token and store the rotating refresh token in an HTTP-only cookie:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`

Administrator user management requires the existing `ADMIN` role. It reads and
updates only safe profile, role, and account-status fields; password hashes and
refresh-session data are never exposed:

- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id/status`

Category discovery is public; creation, update, hiding, and the administration listing require the `ADMIN` role:

- `GET /api/v1/categories`
- `GET /api/v1/categories/:id`
- `GET /api/v1/categories/admin`
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`

Product discovery is public and returns only `AVAILABLE` products. Product catalog administration, image URLs, and selectable options require the `ADMIN` role:

- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `GET /api/v1/products/admin`
- `POST /api/v1/products`
- `PATCH /api/v1/products/:id`
- `DELETE /api/v1/products/:id`

Cart operations require authentication. Cart line prices are captured from the available product at add time and all API totals are calculated as decimal strings:

- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/:itemId`
- `DELETE /api/v1/cart/items/:itemId`

Checkout supports selected cart items and a single direct-purchase item through
one authenticated endpoint. Both flows create the same immutable order and
shipping-address snapshot with a pending COD payment. An optional coupon code
is validated and redeemed atomically with the order:

- `POST /api/v1/checkout`

Registration requires a unique username and email. Login accepts either value through the `identifier` field (the legacy email-only field remains temporarily supported). Authentication responses contain `accessToken`, `tokenType`, `expiresIn`, and a safe user DTO; refresh tokens are never returned in JSON.

To create the idempotent local administrator account after applying migrations, run:

```bash
npx prisma db seed
```

The seed uses the development bootstrap account `admin` / `admin@shop-bandoan.local`. Its password is configured by the requested seed implementation and must be changed before any environment is exposed beyond local development.

## Frontend

The Next.js 15 frontend lives in `frontend/`. Copy `frontend/.env.example` to `frontend/.env.local`, then run:

```bash
cd frontend
npm install
npm run dev
```

It runs on `http://localhost:3001` by default, matching the backend development CORS configuration. See [frontend architecture](docs/frontend-architecture.md) for API, authentication, route, and feature-boundary guidance.

## Verification

From `backend/`:

```bash
npx prisma validate
npm run lint
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

The unit and E2E test suites pass with the global JSON response envelope.
