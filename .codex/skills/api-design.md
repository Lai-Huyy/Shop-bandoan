# Design a Shop-bandoan REST API

## Purpose

Define routes and contracts that fit the existing `/api/v1` NestJS API.

## Use When

Use before adding or changing controller routes, request DTOs, response DTOs,
authorization policy, search, or pagination.

## Current Contract

`main.ts` adds `/api/v1`. `TransformInterceptor` wraps successful controller
data as `success`, `statusCode`, `message`, `timestamp`, and `data`.
`GlobalExceptionFilter` emits matching error metadata. Controllers must return
inner data only.

All routes are JWT-protected unless marked `@Public()`. Use `@Roles(...)` for
role policy. The restaurant module demonstrates public discovery and
administrator-only mutation.

## Design Steps

1. Identify consumer and resource ownership before choosing public/private.
2. Use plural resource paths and standard methods: `POST`, `GET`, `PATCH`, and
   `DELETE`/soft delete.
3. Define body/query/response DTOs before controller implementation.
4. Use `ParseUUIDPipe` for UUID route identifiers.
5. Choose clear expected exceptions: validation, unauthorized, forbidden,
   not-found, and conflict.
6. For lists, bound validated `page`/`limit`, sanitize search, set deterministic
   order, and return item plus metadata.
7. Preserve existing DTO fields and envelope behavior unless compatibility
   change is explicitly approved.

## API Review Questions

- Is anonymous access intentional and documented with `@Public()`?
- Does the route expose only safe fields?
- Does the service return a stable response DTO shape?
- Is pagination necessary before reading a collection?
- Does mutation need `ADMIN`, ownership, or another policy that is not yet
  modeled?

## Handoff

List the new routes, access policy, response data shape, validation failures,
and Swagger updates in the task report.
