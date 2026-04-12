import { forbidden, unauthorized } from "next/navigation";

import type { UserRole } from "@/features/access-control";

import { getSessionUserRole } from "./session-authorization";

export async function getAuthenticatedUserRoleOrRedirect(supabase: unknown): Promise<UserRole> {
  const role = await getSessionUserRole(supabase);

  if (!role) {
    unauthorized();
  }

  return role;
}

export async function requireDashboardRole(supabase: unknown, expectedRole: UserRole): Promise<UserRole> {
  const role = await getAuthenticatedUserRoleOrRedirect(supabase);

  if (role !== expectedRole) {
    forbidden();
  }

  return role;
}