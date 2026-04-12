import type { RoleRoutePermissions } from "../access-control.types";

export const studentRoutePermissions: RoleRoutePermissions = {
  "/admin": "deny",
  "/teacher": "deny",
  "/student": "allow",
  "/students": "deny",
  "/students/[id]": "own-only",
  "/teachers": "deny",
  "/classes": "deny",
  "/sections": "deny",
  "/subjects": "own-only",
  "/offerings": "own-only",
  "/attendance": "own-only",
  "/assessments": "own-only",
  "/grades": "own-only",
  "/report-cards": "own-only",
  "/reports": "deny",
  "/settings": "deny",
};
