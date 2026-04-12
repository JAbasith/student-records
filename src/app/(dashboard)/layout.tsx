import { LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/features/access-control/access-control.types";
import { getAuthenticatedUserRoleOrRedirect } from "@/features/auth/server/dashboard-access";
import { createClient } from "@/lib/supabase/server";

const roleTitles = {
  admin: "Admin workspace",
  teacher: "Teacher workspace",
  student: "Student workspace",
} as const;

type NavItem = {
  href?: string;
  label: string;
};

type NavSection = {
  items: NavItem[];
  title: string;
};

const roleNavigation: Record<UserRole, NavSection[]> = {
  admin: [
    {
      title: "Administration",
      items: [
        { label: "Dashboard", href: "/admin" },
        { label: "Allowlist management", href: "/admin/allowlist" },
        { label: "User management" },
        { label: "Academic setup" },
        { label: "Reports" },
      ],
    },
  ],
  teacher: [
    {
      title: "Teaching",
      items: [
        { label: "Dashboard", href: "/teacher" },
        { label: "My classes" },
        { label: "Attendance" },
        { label: "Assessments" },
        { label: "Grades" },
      ],
    },
  ],
  student: [
    {
      title: "Student",
      items: [
        { label: "Dashboard", href: "/student" },
        { label: "My subjects" },
        { label: "Attendance" },
        { label: "Assessments" },
        { label: "Report cards" },
      ],
    },
  ],
};

function NavItemRow({ item }: Readonly<{ item: NavItem }>) {
  if (item.href) {
    return (
      <Link
        href={item.href}
        className="block rounded-xl border border-border/70 bg-background px-3 py-2 text-sm font-medium text-brand-ink transition-colors hover:bg-muted"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <span className="block rounded-xl border border-border/60 bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
      {item.label}
    </span>
  );
}

function getFlatNavItems(sections: NavSection[]): NavItem[] {
  return sections.flatMap((section) => section.items);
}

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const supabase = await createClient();
  const role = await getAuthenticatedUserRoleOrRedirect(supabase);
  const navigation = roleNavigation[role];

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

      <main className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              {navigation.map((section) => (
                <div key={section.title} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">{section.title}</p>
                  <div className="space-y-2">
                    {section.items.map((item) => <NavItemRow key={item.label} item={item} />)}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-4">
            <section className="space-y-3 lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {getFlatNavItems(navigation).map((item) => (
                  <div key={item.label} className="min-w-44">
                    <NavItemRow item={item} />
                  </div>
                ))}
              </div>
            </section>

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}