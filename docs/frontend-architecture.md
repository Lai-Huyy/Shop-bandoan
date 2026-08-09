# Frontend architecture

## Scope

`frontend/` is a standalone Next.js 15, React 19, TypeScript, and Tailwind CSS
application. It establishes navigation, authentication, API access, theming,
forms, reusable UI primitives, and future feature boundaries. It does not add
or infer backend routes.

## Layout

```text
frontend/src/
├── app/          App Router routes and route-group layouts
├── components/   shadcn-compatible UI, shared states, forms, and layout
├── constants/    Route navigation metadata
├── features/     Feature-local form and presentation components
├── hooks/        Client hooks such as useAuth
├── lib/          Axios client, token memory store, error mapping, utilities
├── providers/    Query, theme, toast, and authentication providers
├── services/     One typed service per backend capability
└── types/        API-envelope and domain contracts
```

Route groups separate the anonymous authentication pages from the client-side
protected shell. The public restaurant page is deliberately outside the
protected group because `GET /api/v1/restaurants` and
`GET /api/v1/restaurants/:id` are public backend endpoints.

## Backend contract

The client uses `NEXT_PUBLIC_API_URL`, which must point to the NestJS `/api/v1`
base URL. All successful API calls unwrap the existing envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "timestamp": "...",
  "data": {}
}
```

The implemented services are limited to documented backend routes:

- `authService`: register, login, refresh, logout, and current user;
- `restaurantsService`: public list and lookup by UUID;
- `healthService`: dependency-health lookup.
- `adminUsersService`: administrator-only user listing, detail, profile/role
  updates, and account-status updates through `/admin/users`.

Products, cart, and checkout use typed services backed by the current API.
Cart selection is local UI state; only selected cart-item IDs are submitted to
the shared checkout endpoint. A direct purchase sends one product payload to
that same endpoint and never creates a temporary cart row. Categories, orders,
and notifications remain placeholders until their backend modules exist.

The address book uses the authenticated `/users/addresses` CRUD contract and a
shared React Query key. Checkout selects one persisted address and sends only
its ID; the backend copies the complete address, including its optional delivery
note, into the immutable order shipping snapshot. This keeps checkout and
profile address management consistent without client-side temporary storage.

Administrators may create a product with one local JPEG, PNG, or WebP image.
The product form sends `multipart/form-data` to the existing `POST /products`
route only when a file is selected; otherwise it preserves the JSON request
contract. The backend validates and stores the file locally, then returns its
public product-image URL. This local storage is for development and must be
backed by persistent shared storage or object storage in deployment.

Order pages use `ordersService` as the single Order API adapter. Customer pages
request server-paginated order history and order detail, while the administrator
dashboard requests the protected admin list, detail, operational summary, and
workflow updates. Shared order status badges and timelines render the immutable
`OrderStatusLog` history; customer "Mua lại" calls the server-side
`POST /orders/:id/buy-again` endpoint, which owns order access and cart writes.

`lib/address-data.ts` is the only frontend module that imports the committed
Vietnamese administrative JSON. It caches the 34 province/city records and
their wards/communes in module memory; address components use its helpers and
never import the dataset directly. The dataset reflects the current two-tier
selection (`province/city → ward/commune`), so the address UI does not expose a
district field.

## Inventory interaction

The shared product type carries `stockQuantity` and `soldQuantity`. Product
cards, the buy-now dialog, product detail, and cart quantity controls use the
available quantity as a customer-facing ceiling. Zero-stock items remain in
catalog results with disabled purchase controls. Administrators set stock during
product creation or with the existing product update route. These client-side
checks improve feedback only; atomic server-side checkout reservation is the
source of truth for concurrent requests.

## Category navigation

The public Categories page uses the existing paginated `GET /categories` API
with a bounded `limit=100` query and shares its TanStack Query cache with the
Products page. Category cards navigate to `/products?category=<id>`. Products
reads `category`, `search`, `sort`, and `page` from the URL, sends the selected
category as `categoryId` to `GET /products`, and preserves the remaining query
parameters when filters or pagination change. The Product API performs search,
category filtering, pagination, and supported sort options (`newest`, price
ascending/descending, and popular) in PostgreSQL; the frontend does not fetch a
large catalog to filter locally. Category product counts are deliberately not
shown because the existing Category API does not return them.

## Coupon flow

Administrators manage coupons at `/admin/coupons`, choosing either all catalog
items or one existing category as the scope. The form uses a shared
`DateTimePicker` (calendar, month/year navigation, and time selector) and labels
the configured total as **Số lượng mã giảm giá**. This is the number of customers
who may claim the coupon, not a per-user redemption count. The admin table and
analytics use live API data for total quantity, remaining quantity, claims, and
uses.

Customers use `/coupons` to browse active claimable coupons and their own
coupon wallet. The client never stores coupon state locally: it calls the
customer Coupon APIs, and claim mutations invalidate both lists. Checkout no
longer accepts typed coupon codes. It sends only selected cart IDs or direct
product/quantity to `POST /coupons/checkout-options`, displays the returned
owned unused coupon choices, and sends the selected `couponClaimId` to the
existing Checkout endpoint. Prices and eligibility are always calculated by the
backend. The backend applies a coupon to exactly one eligible unit—the
highest-priced matching item—and marks its claim used atomically while creating
the order and immutable snapshots.

## Authentication

The browser never stores a refresh token in local or session storage. The
backend owns it in the existing `refresh_token` HTTP-only cookie. The frontend:

1. Keeps only the access token in an in-memory store.
2. Sends it in the Axios bearer header.
3. Uses credentialed requests so the refresh cookie is sent to `/auth/refresh`
   and `/auth/logout`.
4. Rehydrates a session on application load through `/auth/refresh`.
5. Retries one failed protected request after a successful refresh.
6. Clears the in-memory token and React Query cache on logout or refresh failure.

`ProtectedRoute`, `PublicRoute`, and `RoleGuard` are client-side guards. They
wait for refresh rehydration so page access does not flicker. Administrative
routes additionally require `ADMIN` navigation/guard access, matching the
backend role model. They complement but do not replace backend authorization.

## UI and state

`components/ui/` contains shadcn-compatible primitives built with Tailwind and
Radix where interaction semantics are needed. The shared shell provides a
responsive desktop sidebar, mobile drawer navigation, header, breadcrumbs, and
footer. Light, dark, and system themes are persisted by `next-themes`; Sonner
provides accessible toast feedback.

`components/ui/confirm-dialog.tsx` is the single confirmation boundary for
destructive or important client actions. It wraps Radix AlertDialog for focus
management, Escape-key dismissal, and keyboard navigation; it accepts an
action-specific icon, colour variant, warning text, and asynchronous callback.
Callbacks keep the dialog controls disabled while pending, close only on
success, and surface failures through the action's existing Sonner toast. Do
not use browser `alert`, `confirm`, or `prompt` APIs in application code.

TanStack Query owns server state and request lifecycle. React Hook Form with
Zod validates the login and registration contracts before requests are sent.
No Redux store is used because current global state is limited to the session,
which is supplied by `AuthProvider`.

## Development

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
npm run lint
npm run build
```

Set `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1` for local development.
The backend must permit the frontend origin with credentials; its current
development example permits `http://localhost:3001`.

## Future module rule

When a backend module becomes available, replace only its corresponding typed
unavailable service and placeholder feature page. Keep API response unwrapping,
authentication, shared states, and route guards centralized; do not create
parallel Axios clients or duplicate token/refresh logic. Wishlist is not an
active frontend feature and must not be reintroduced without a separate product
decision; the existing database table is intentionally retained for now.
