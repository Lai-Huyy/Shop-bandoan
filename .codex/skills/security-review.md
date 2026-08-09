# Review Shop-bandoan Security Boundaries

## Purpose

Perform a focused security review using the application's actual NestJS,
Prisma, JWT, cookie, CORS, and Docker conventions.

## Use When

Use before handing off authentication, authorization, data exposure, new input,
environment, Docker, payment, webhook, or administrative changes.

## Review Checklist

- Confirm unannotated routes remain protected by the global `JwtAuthGuard`.
- Verify every `@Public()` route is intentionally anonymous.
- Confirm `@Roles(...)` policy and `@ApiBearerAuth()` match protected mutations.
- Check DTO validation against the global whitelist/forbid/transform pipe.
- Ensure response DTOs and logs omit password hashes, refresh tokens, headers,
  cookies, provider secrets, and raw payment payloads.
- Verify Prisma access enforces ownership, active state, and soft-delete filters
  in the repository/service layer.
- Confirm expected errors become Nest exceptions, not raw Prisma messages.
- Check config flows through `ConfigService` and production validation still
  requires long JWT secrets and explicit credentialed CORS origins.
- Check refresh changes preserve HttpOnly, SameSite Lax, `/api/v1/auth` path,
  production secure cookies, hash storage, rotation, and revocation.
- Review Docker changes for accidental production credentials/port exposure.

## Output

Rank findings by severity, cite exact files/lines, distinguish verified facts
from assumptions, and do not modify code unless the task authorizes remediation.
