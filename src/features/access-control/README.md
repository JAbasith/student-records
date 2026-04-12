# Access Control Module

This module centralizes route-level authorization decisions.

## Folder Purpose

- `route-catalog.ts`: canonical list of app routes and typed route names.
- `access-control.types.ts`: shared role, policy, and decision types.
- `roles/`: one file per role containing route policy maps.
- `role-permissions.ts`: combines per-role policy maps into one registry.
- `route-access-evaluator.ts`: single decision engine for allow/deny checks.
- `role-dashboard-routes.ts`: role -> dashboard route mapping.
- `index.ts`: barrel exports for stable imports.

## Usage Pattern

1. Resolve current user role.
2. Build a `RouteAccessContext`.
3. Call `evaluateRouteAccess(context)`.
4. Enforce on server routes and UI navigation.

## Rules

- Do not add inline role checks directly in pages/components.
- Add new route policy changes only in role files.
- Keep evaluator pure and side-effect free.
