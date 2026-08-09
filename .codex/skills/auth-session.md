# Work Safely in Shop-bandoan Authentication

## Purpose

Change authentication, authorization, or session behavior without weakening the
current JWT and refresh-cookie security contract.

## Use When

Use for registration, login, logout, refresh, JWT claims, role checks, password
handling, `UserSession`, access guards, CORS credentials, or cookie changes.

## Existing Contract

- `AuthService` owns user/password/session workflows and creates a cart during
  customer registration.
- `AuthTokenService` creates access and refresh JWTs and verifies refresh claims.
- `AuthCookieService` sets/clears `refresh_token` as HTTP-only, SameSite Lax,
  scoped to `/api/v1/auth`, and secure only in production.
- Access JWTs are bearer tokens with `sub`, `email`, `role`, and `type: access`.
- Refresh JWTs have `sub`, `sid`, and `type: refresh`.
- Refresh sessions persist a bcrypt hash, expiry, revocation flag, device data,
  and IP address in `UserSession`.
- `JwtAuthGuard` is global; `RolesGuard` checks `@Roles(...)` metadata.

## Change Workflow

1. Identify affected token claims, cookie attributes, DB session fields, client
   behavior, Swagger security metadata, and CORS requirements.
2. Preserve token type checks and production secret validation.
3. Hash passwords and refresh tokens with configured bcrypt rounds only.
4. Preserve refresh rotation's conditional `updateMany` behavior; it prevents
   concurrent token replay.
5. Keep logout idempotent and ensure it clears the cookie.
6. Test valid, expired/invalid, revoked, concurrent refresh, inactive-user, and
   unauthorized/forbidden paths as applicable.

## Do Not

- Return a refresh token, password hash, or raw session secret in JSON/logs.
- Move refresh storage to local storage.
- Change cookie path, SameSite, secure flag, or CORS credentials independently.
- Trust JWT role claims without the strategy's active-user/role database check.
