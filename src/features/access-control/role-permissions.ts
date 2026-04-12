import type { RoleRoutePermissions, UserRole } from "./access-control.types";
import { adminRoutePermissions } from "./roles/admin";
import { studentRoutePermissions } from "./roles/student";
import { teacherRoutePermissions } from "./roles/teacher";

export const routePermissionsByRole: Record<UserRole, RoleRoutePermissions> = {
  admin: adminRoutePermissions,
  teacher: teacherRoutePermissions,
  student: studentRoutePermissions,
};
