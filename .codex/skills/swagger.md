# Document Shop-bandoan APIs with Swagger

## Purpose

Keep Swagger at `/api/docs` aligned with the actual NestJS API contract.

## Use When

Use for every new or changed route, DTO, authorization rule, cookie behavior,
pagination shape, or meaningful error response.

## Existing Convention

Controllers use `@ApiTags()` and `@ApiOperation()`. DTO fields use
`@ApiProperty()` or `@ApiPropertyOptional()`. Restaurants document success,
conflict, not-found, unauthorized, forbidden, UUID parameters, and bearer auth.
Auth documents the `refresh_token` cookie with `@ApiCookieAuth()`.

Swagger's document builder registers bearer auth and the `refresh_token` cookie
globally in `backend/src/main.ts` when `SWAGGER_ENABLED=true`.

## Workflow

1. Add a domain tag and concise operation summary.
2. Document body/query/response DTO fields with accurate requiredness, nullable
   values, examples, limits, and formats.
3. Add `@ApiParam` for IDs and route parameters.
4. Add `@ApiBearerAuth()` to bearer-protected routes and cookie auth to refresh
   cookie routes.
5. Document the success code and all significant expected failures.
6. Keep response metadata consistent with the global envelope: Swagger response
   types describe the controller's `data` payload, not a manually nested envelope.
7. Verify the generated documentation when the application can be run.

## Common Drift to Prevent

- Swagger says a nullable Prisma field is required.
- A protected route lacks bearer documentation.
- A public route documents authorization it does not require.
- Pagination metadata is missing from list responses.
- Refresh endpoints imply the refresh token is JSON rather than HTTP-only cookie.
