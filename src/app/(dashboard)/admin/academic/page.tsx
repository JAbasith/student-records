import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcademicSetupPanel } from "@/features/academic-setup/components/academic-setup-panel";
import { getAcademicSetupData } from "@/features/academic-setup/server/get-academic-setup-data";
import { requireDashboardRole } from "@/features/auth/server/dashboard-access";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAcademicSetupPage() {
  const supabase = await createClient();
  await requireDashboardRole(supabase, "admin");

  const data = await getAcademicSetupData();

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_70%_30%,rgba(37,99,235,0.14),transparent_60%),radial-gradient(circle_at_10%_80%,rgba(14,165,233,0.12),transparent_45%)]" />
        <CardHeader className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Academic setup
            </Badge>
          </div>
          <CardTitle className="max-w-2xl text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
            Build curriculum delivery from one admin flow
          </CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7 text-brand-muted">
            Create subject catalog entries, map offerings to sections, assign teachers, and enroll students with both single and bulk patterns.
          </CardDescription>
          <div>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/admin">
                Back to dashboard
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <AcademicSetupPanel data={data} />
    </div>
  );
}
