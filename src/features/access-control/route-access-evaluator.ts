import type { RouteAccessContext, RouteAccessDecision } from "./access-control.types";
import { routePermissionsByRole } from "./role-permissions";

export function evaluateRouteAccess(context: RouteAccessContext): RouteAccessDecision {
  const policy = routePermissionsByRole[context.role][context.route];

  if (policy === "allow") {
    return { allowed: true, policy };
  }

  if (policy === "deny") {
    return { allowed: false, policy, reason: "forbidden" };
  }

  if (policy === "assigned-only") {
    return context.isAssignedToTeacher
      ? { allowed: true, policy }
      : { allowed: false, policy, reason: "requires-assignment" };
  }

  return context.isOwnRecord
    ? { allowed: true, policy }
    : { allowed: false, policy, reason: "requires-ownership" };
}
