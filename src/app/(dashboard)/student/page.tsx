import {
  BookOpen,
  CalendarDays,
  ChartColumnBig,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { ComponentType } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireDashboardRole } from "@/features/auth/server/dashboard-access";
import { createClient } from "@/lib/supabase/server";

const studentStats = [
  { label: "Attendance rate", value: "96%", note: "2 excused absences", icon: CalendarDays },
  { label: "Average grade", value: "A-", note: "Across 6 active subjects", icon: GraduationCap },
  { label: "Next assessment", value: "Friday", note: "Mathematics quiz", icon: Clock3 },
  { label: "Completed tasks", value: "11", note: "Assignment submissions this term", icon: CheckCircle2 },
];

const resultRows = [
  ["Mathematics", "88%", "A", "Report card ready"],
  ["Science", "84%", "B+", "Awaiting final practical"],
  ["English", "91%", "A", "Published"],
  ["ICT", "79%", "B", "Published"],
];

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60 bg-card/90">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-brand-ink">{value}</p>
          <p className="mt-1 text-xs text-brand-muted">{note}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  await requireDashboardRole(supabase, "student");

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card className="relative overflow-hidden border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_75%_25%,rgba(59,130,246,0.14),transparent_55%),radial-gradient(circle_at_10%_70%,rgba(16,185,129,0.12),transparent_45%)]" />
          <CardHeader className="relative z-10 gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="mr-1.5 size-3.5" />
                Student portal
              </Badge>
              <Badge className="rounded-full bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300">
                Personal view only
              </Badge>
            </div>
            <CardTitle className="max-w-2xl text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              See your attendance, grades, and progress in one calm snapshot.
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-brand-muted">
              The student workspace only surfaces your own data and keeps the most important progress signals visible.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="text-brand-ink">This term</CardTitle>
            <CardDescription>Quick reminders and the next deadline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="font-medium text-brand-ink">Mathematics quiz</p>
              <p className="mt-1 text-sm text-brand-muted">Friday, 09:00 - prepare chapters 4 to 6.</p>
            </div>
            <Button className="w-full justify-between">
              Open report card
              <FileText className="size-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              View attendance history
              <TrendingUp className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {studentStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <Tabs defaultValue="snapshot" className="gap-4">
          <TabsList className="flex w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/90 p-1">
            <TabsTrigger value="snapshot" className="shrink-0 rounded-xl px-4 py-2">
              <UserRound className="size-4" />
              Snapshot
            </TabsTrigger>
            <TabsTrigger value="attendance" className="shrink-0 rounded-xl px-4 py-2">
              <CalendarDays className="size-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="grades" className="shrink-0 rounded-xl px-4 py-2">
              <ChartColumnBig className="size-4" />
              Grades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snapshot" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-brand-ink">Personal summary</CardTitle>
                  <CardDescription>
                    A clean view of your own records, summaries, and subject workload.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Advisory note", "Keep your attendance above 95% to stay on track."],
                    ["Subject load", "6 enrolled subjects this term."],
                    ["Progress flag", "Mathematics is trending upward."],
                    ["Report status", "Latest report card generated and available."],
                  ].map(([title, copy]) => (
                    <div key={title} className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                      <p className="font-medium text-brand-ink">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-brand-muted">{copy}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-brand-ink">What to do next</CardTitle>
                  <CardDescription>Only the actions relevant to you are shown here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="font-medium text-brand-ink">Review Science notes</p>
                    <p className="mt-1 text-sm text-brand-muted">Due before tomorrow&apos;s lesson.</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="font-medium text-brand-ink">Complete English assignment</p>
                    <p className="mt-1 text-sm text-brand-muted">Upload the final draft by 4 PM.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-brand-ink">Attendance history</CardTitle>
                <CardDescription>
                  Your daily attendance is shown as a simple, school-safe summary.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-175">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ["12 Apr", "Present", "On time"],
                        ["11 Apr", "Late", "Bus delay"],
                        ["10 Apr", "Present", "On time"],
                        ["9 Apr", "Excused", "Medical note"],
                      ].map(([date, status, note]) => (
                        <TableRow key={date}>
                          <TableCell className="font-medium text-brand-ink">{date}</TableCell>
                          <TableCell>{status}</TableCell>
                          <TableCell>{note}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="space-y-4">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-brand-ink">Subject performance</CardTitle>
                <CardDescription>
                  Report card summaries are powered by cached term results for fast loading.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="min-w-175">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultRows.map(([subject, percentage, grade, status]) => (
                        <TableRow key={subject}>
                          <TableCell className="font-medium text-brand-ink">{subject}</TableCell>
                          <TableCell>{percentage}</TableCell>
                          <TableCell>{grade}</TableCell>
                          <TableCell className="text-brand-muted">{status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <aside className="space-y-4">
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-brand-ink">Progress notes</CardTitle>
              <CardDescription>What the current term says about your pace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-brand-muted">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                Your attendance is above average and your English result is the strongest.
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                Science needs one more practical score before the final grade is locked.
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                One of your assessments is still open for publishing by the teacher.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-brand-ink">Fast actions</CardTitle>
              <CardDescription>Simple entry points for your own records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-between">
                Open my report card
                <FileText className="size-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between">
                View enrolled subjects
                <BookOpen className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
