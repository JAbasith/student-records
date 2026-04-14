import Link from "next/link";

import { Button } from "@/components/ui/button";
import { requireDashboardRole } from "@/features/auth/server/dashboard-access";
import { UsersManagementPanel } from "@/features/user-management/components/users-management-panel";
import { getUsersManagementData } from "@/features/user-management/server/get-users-management-data";
import { createClient } from "@/lib/supabase/server";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const supabase = await createClient();
  await requireDashboardRole(supabase, "admin");

  const params = await searchParams;

  const page = Math.max(1, Number.parseInt(getSingleQueryValue(params.page) || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, Number.parseInt(getSingleQueryValue(params.pageSize) || "20", 10) || 20));

  const role = getSingleQueryValue(params.role) || "all";
  const status = getSingleQueryValue(params.status) || "all";
  const grade = getSingleQueryValue(params.grade);
  const section = getSingleQueryValue(params.section);
  const academicYear = getSingleQueryValue(params.academicYear);

  const data = await getUsersManagementData({
    page,
    pageSize,
    search: getSingleQueryValue(params.search),
    role: role as "all" | "admin" | "teacher" | "student",
    status: status as "all" | "active" | "inactive",
    grade: grade === "all" ? "" : grade,
    section: section === "all" ? "" : section,
    academicYear: academicYear === "all" ? "" : academicYear,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Browse, filter, and manage students, teachers, and admins in one optimized workspace.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Back to dashboard</Link>
        </Button>
      </div>

      <UsersManagementPanel data={data} />
    </div>
  );
}
