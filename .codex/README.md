# Shop-bandoan Codex Workspace

This workspace gives Codex task-level implementation aids for the current
Shop-bandoan backend. It complements `AGENTS.md`; it does not replace project
governance, architecture rules, or user instructions.

## Purpose

`AGENTS.md` defines the durable repository contract: safety, architecture,
security, delivery, documentation, and Git authority. The files in this folder
turn that contract into focused workflows for recurring work in this codebase.

They are deliberately grounded in the current backend:

- NestJS modules under `backend/src/modules/`;
- global JWT/roles guards, envelope interceptor, and exception filter;
- Prisma client generated to `backend/generated/prisma`;
- PostgreSQL 17 and Redis 7 from root Compose;
- `auth`, `health`, and `restaurants` as reference modules;
- Jest unit tests under `backend/src/` and E2E tests under `backend/test/`.

## Priority Order

When instructions differ, apply this order:

1. System, developer, and explicit user instructions.
2. `AGENTS.md`.
3. The current task's relevant files and existing behavior.
4. `docs/coding-standards.md`, `docs/project-context.md`, and
   `docs/project-audit.md`.
5. A matching `.codex/skills/` workflow.
6. A `.codex/prompts/` checklist.

Skills and prompts cannot authorize commits, pushes, migrations against shared
databases, destructive operations, or a new business rule.

## Skills

Use a skill when the task matches its delivery shape. Skills are concise
implementation playbooks, not generic coding standards.

| Skill | Use it for |
| --- | --- |
| `create-module.md` | A new domain module such as categories or coupons |
| `prisma-design.md` | Evaluating model, relation, constraint, or index changes |
| `migration.md` | Creating and validating a reviewed Prisma migration |
| `repository-pattern.md` | Repository-backed query policies such as soft delete or pagination |
| `api-design.md` | Versioned routes, response contracts, pagination, and access decisions |
| `swagger.md` | Swagger decorators and contract alignment |
| `auth-session.md` | Access JWT, refresh cookie, session, or role behavior |
| `testing.md` | Unit/E2E test design and current command selection |
| `security-review.md` | Focused review of an API/security change |
| `code-review.md` | Review of a scoped implementation diff |
| `bug-fix.md` | Reproduction-led defect correction |
| `refactor.md` | Behavior-preserving, scoped structural work |
| `docker.md` | Local PostgreSQL/Redis Compose changes or diagnostics |

Read only the skill(s) relevant to the task after reading `AGENTS.md` and the
affected code. Do not treat a skill as a substitute for inspecting the module
being changed.

## Prompts

Prompts are reusable task briefs for an agent or a reviewer. Use one when a
request would benefit from a complete, repeatable sequence of discovery,
planning, implementation/review, verification, and reporting.

Adapt placeholders to concrete Shop-bandoan modules and routes. Remove steps
that do not apply rather than inventing frontend, CI, or deployment artifacts
that do not exist.

## Maintenance

Update this workspace only when a repeated implementation pattern changes. For
example, revise the auth-session skill if refresh-cookie policy changes, or the
testing skill when E2E bootstrapping becomes production-equivalent.

Keep repository rules in `AGENTS.md`; keep external project status and setup in
`README.md` and `docs/`; keep narrowly reusable execution guidance here.
