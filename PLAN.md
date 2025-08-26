# Project Audit Plan

Purpose: Audit and complete the Admin Panel, Authentication, RBAC, Dialogue, World tools, CLI, and docs/testing according to the feature summary. This is a living plan. We will update progress and check off tasks as they are completed.

Last updated: 2025-08-26

## Audit Summary (Findings)

- Authentication & Security
  - Passwords are stored in plaintext in `server/networking/user.service.ts` and `scripts/seed-admin-users.js` (hash-ready desired).
  - Login returns a non-JWT token string; `PermissionGuard` doesn’t parse Authorization headers and expects a userId (via `x-user-id`, session, body, or query). The web client sends only `Authorization: Bearer <token>`, so most admin routes will reject as unauthenticated.
  - Session persistence exists as JSON via `UserService` but isn’t connected to HTTP auth.
  - Test script uses `/api/auth/login`, but server exposes `/auth/login`.

- Permissions / RBAC
  - `PermissionGuard` checks roles/permissions but can’t identify the user from current frontend requests. Decorators use `Reflector.createDecorator` which is okay; core issue is request identity.

- Web Admin Panel (clients/admin)
  - ApiService sends `Authorization: Bearer <token>` only; does not set `x-user-id` header that the backend guard expects.
  - UsersTab invokes PUT endpoints via POST (`api.post(...)`), causing method mismatches (`/admin/users/:id/role|password|activate|deactivate` expect PUT in server).
  - Dialogue tools expect `/admin/dialogue/trees`: server reads from `engine/modules/world/content/dialogue` which doesn’t exist; dialogue examples live in `engine/modules/dialogue/examples`.
  - Login demo credentials in UI are outdated compared to seed: seed uses `admin/admin123`, `mod/mod123`, `player/player123`.

- CLI & Tools
  - `tools/commands/user-service.ts` implements add/promote/demote/list/delete against `data/users.json`, but it’s not wired into `mudctl.ts` (import commented out).
  - Separate admin CLI (`tools/commands/admin.ts`) writes to `data/admin/…` (a different users store) – potential duplication; for the requested feature set, the user-service CLI against `data/users.json` is preferred.

- Dialogue Management
  - AdminDialogueController returns/updates in-memory or YAML files but the directory path is wrong; YAML exists in `engine/modules/dialogue/examples`.

- Docs & Tests
  - README claims JWT-based auth; implementation is simple token string; needs alignment.
  - Tests exist (many JS scripts and vitest config). The comprehensive admin panel script targets `/api/auth/login` and expects Authorization Bearer session use.

## Tasks

Legend: [ ] = pending, [x] = done

### Missing Features

- [ ] Secure password storage (hashing) and verification
  - Files: `server/networking/user.service.ts`, `scripts/seed-admin-users.js`, `tools/commands/user-service.ts`
  - Steps:
    1. Introduce a lightweight hashing utility (Node crypto scrypt/argon2/bcryptjs). Prefer `bcryptjs` to avoid native build.
    2. Hash at creation/reset; verify on login; migrate existing plaintext on first login (optional).
    3. Mark storage “hash-ready” in docs.

- [ ] HTTP auth compatibility: make admin routes recognize the web client
  - Files: `server/networking/permission.guard.ts`, `clients/admin/App.js`
  - Steps:
    1. Frontend: include `x-user-id` header from stored `user_data.userId` for all requests.
    2. Backend: extend guard to accept `Authorization: Bearer <userId>` as a fallback (thin shim for test scripts), and map simple “web_token_*” to userId if present in session store.

- [ ] Add alias for `/api/auth/login` while retaining `/auth/login`
  - Files: `server/networking/auth.controller.ts`
  - Steps:
    1. Add an extra handler or a small proxy method to accept POST `/api/auth/login` and reuse login logic.

### Bugs

- [ ] Fix UsersTab method mismatches (use PUT for role/password/activate/deactivate)
  - Files: `clients/admin/Components.js`
  - Steps:
    1. Switch action calls from `api.post` to `api.put` for the proper endpoints.

- [ ] Fix dialogue path to load existing content
  - Files: `server/admin/controllers/admin-dialogue.controller.ts`
  - Steps:
    1. Change dialogue directory from `engine/modules/world/content/dialogue` to `engine/modules/dialogue/examples` and support YAML/JSON.

- [ ] Update UI demo credentials text
  - Files: `clients/admin/App.js`
  - Steps:
    1. Replace hint with `admin/admin123`, `mod/mod123`, `player/player123`.

### Improvements

- [ ] Wire user-service CLI into mudctl
  - Files: `tools/mudctl.ts`
  - Steps:
    1. Uncomment import for `UserServiceCommands` and register under `admin` namespace or as `user-service` root.
    2. Document usage in `tools/README.md` (if present) and `docs/admin-tools-guide.md`.

- [ ] Audit/align README with actual auth (token vs JWT)
  - Files: `README.md`
  - Steps:
    1. Adjust claims to “simple token + header-based auth” for now; add note that JWT is planned.

- [ ] Add basic audit logging details to responses where applicable
  - Files: controllers in `server/admin/controllers/*`
  - Steps:
    1. Optionally include `@EnableAuditLog()` where sensitive changes occur (some already present).

### Testing

- [ ] Update or add tests for:
  - Files: `test-admin-panel-comprehensive.js`, `test/*` where appropriate
  - Steps:
    1. Exercise login via both `/auth/login` and `/api/auth/login`.
    2. Verify guard accepts `x-user-id` and Bearer `<userId>` shims.
    3. Validate UsersTab/endpoint method correctness (PUT vs POST).
    4. Validate dialogue loading from examples directory.

## Execution Order (High-Impact First)

1) Fix client-server auth handshake: add `x-user-id` header in client; extend guard to accept Bearer userId. [Bug unblocker]

2) Fix UsersTab to use PUT for updates. [Bug unblocker]

3) Point dialogue controller to examples directory; verify trees list. [Feature unblocker]

4) Add `/api/auth/login` alias. [Test compatibility]

5) Wire user-service CLI into `mudctl`. [CLI feature]

6) Implement password hashing and verification. [Security]

7) Update docs; expand tests. [Docs/QA]

## Progress Log

- 2025-08-26: Initial audit completed; created PLAN.md with prioritized tasks.

## Notes / Assumptions

- Short-term: use simple headers to bridge auth (x-user-id, Bearer userId) to stabilize RBAC without introducing full JWT.
- Dialogue persistence: keeping YAML/JSON read/write from examples directory is acceptable for admin tooling demo; full engine integration can be a later enhancement.
- CLI duplication: continue using `data/users.json` (UserService) for required user CLI operations; the separate `data/admin/` store is out of scope for this feature set.
