# Auth Module

This module centralizes login flow behavior and shared auth UI helpers.

## Folder Purpose

- `server/session-authorization.ts`: callback/session authorization logic and role lookup.
- `constants/login-errors.ts`: shared login error codes and messages.
- `utils/get-login-error-code.ts`: URL query parser for login errors.
- `components/google-icon.tsx`: reusable Google icon component.

## Usage Pattern

1. Login page initiates OAuth.
2. Callback route delegates session checks to server module.
3. Server module validates allowlist and resolves role.
4. Callback redirects to role-specific dashboard.

## Rules

- Keep route handlers thin; move business logic to `server/`.
- Reuse error codes from constants; avoid ad-hoc strings.
- Keep client-only parsing logic in `utils/`.
