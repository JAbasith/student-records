import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUserRoleOrRedirect } from "@/features/auth/server/dashboard-access";
import { createClient } from "@/lib/supabase/server";

const roleTitles = {
  admin: "Admin workspace",
  teacher: "Teacher workspace",
  student: "Student workspace",
} as const;

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const supabase = await createClient();
  const role = await getAuthenticatedUserRoleOrRedirect(supabase);

  async function handleSignOut() {
    "use server";

    const signOutClient = await createClient();
    await signOutClient.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_10%,rgba(4,120,87,0.09),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(37,99,235,0.11),transparent_26%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background)_86%,white))] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-size-[28px_28px] opacity-45" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.14),transparent_70%)] blur-3xl" />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_30px_rgba(59,130,246,0.22)]">
              <span className="font-heading text-sm font-semibold tracking-[0.22em]">SR</span>
            </div>
            <div>
              <p className="font-heading text-sm font-semibold tracking-[0.22em] uppercase text-brand-ink">
                Student Records
              </p>
              <p className="text-xs text-brand-muted">Operations workspace</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Badge variant="outline" className="rounded-full border-border/70 bg-background/80 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {roleTitles[role]}
            </Badge>
          </div>

          <form action={handleSignOut}>
            <Button type="submit" variant="outline" size="sm" className="rounded-full border-border/70 bg-background/90">
              <LogOut className="size-4" />
              Logout
            </Button>
          </form>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}