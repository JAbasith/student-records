import type { RoleRoutePermissions } from "../access-control.types";

export const teacherRoutePermissions: RoleRoutePermissions = {
  "/admin": "deny",
  "/teacher": "allow",
  "/student": "deny",
  "/students": "assigned-only",
  "/students/[id]": "assigned-only",
  "/teachers": "deny",
  "/classes": "assigned-only",
  "/sections": "assigned-only",
  "/subjects": "assigned-only",
  "/offerings": "assigned-only",
  "/attendance": "assigned-only",
  "/assessments": "assigned-only",
  "/grades": "assigned-only",
  "/report-cards": "assigned-only",
  "/reports": "assigned-only",
  "/settings": "deny",
};
