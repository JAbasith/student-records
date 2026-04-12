import type { AppRoute } from "./route-catalog";

export type UserRole = "admin" | "teacher" | "student";

export type RoutePolicy = "allow" | "deny" | "assigned-only" | "own-only";

export type RoleRoutePermissions = Record<AppRoute, RoutePolicy>;

export interface RouteAccessContext {
  role: UserRole;
  route: AppRoute;
  isAssignedToTeacher?: boolean;
  isOwnRecord?: boolean;
}

export interface RouteAccessDecision {
  allowed: boolean;
  policy: RoutePolicy;
  reason?: "forbidden" | "requires-assignment" | "requires-ownership";
}
