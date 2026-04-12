import { redirect } from "next/navigation";

import { getDashboardRouteForRole, type UserRole } from "@/features/access-control";

import { getSessionUserRole } from "./session-authorization";

export async function getAuthenticatedUserRoleOrRedirect(supabase: unknown): Promise<UserRole> {
  const role = await getSessionUserRole(supabase);

  if (!role) {
    redirect("/login");
  }

  return role;
}

export async function requireDashboardRole(supabase: unknown, expectedRole: UserRole): Promise<UserRole> {
  const role = await getAuthenticatedUserRoleOrRedirect(supabase);

  if (role !== expectedRole) {
    redirect(getDashboardRouteForRole(role));
  }

  return role;
}