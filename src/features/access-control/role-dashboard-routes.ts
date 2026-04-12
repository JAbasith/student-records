import type { UserRole } from "./access-control.types";

export const ROLE_DASHBOARD_ROUTE: Record<UserRole, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

export function getDashboardRouteForRole(role: UserRole): string {
  return ROLE_DASHBOARD_ROUTE[role];
}
