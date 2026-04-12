import type { RoleRoutePermissions } from "../access-control.types";
import { APP_ROUTES } from "../route-catalog";

export const adminRoutePermissions = Object.fromEntries(
  APP_ROUTES.map((route) => [route, "allow"]),
) as RoleRoutePermissions;
