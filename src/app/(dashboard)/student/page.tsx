import {
  BookMarked,
  BookOpen,
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
  { label: "Subjects", value: "6", note: "Active this term", icon: BookMarked },
  { label: "Average grade", value: "A-", note: "Across your subjects", icon: GraduationCap },
  { label: "Next lesson", value: "Friday", note: "Mathematics quiz", icon: Clock3 },
  { label: "Completed tasks", value: "11", note: "Assignments submitted", icon: CheckCircle2 },
];

const resultRows = [
  ["Mathematics", "88%", "A", "Report card ready"],
  ["Science", "84%", "B+", "Awaiting final practical"],
  ["English", "91%", "A", "Published"],
  ["ICT", "79%", "B", "Published"],
];

const mySubjects = [
  {
    name: "Mathematics",
    nextClass: "Tue 09:00",
    teacher: "Mr. John Carter",
  },
  {
    name: "English",
    nextClass: "Wed 10:30",
    teacher: "Ms. Emily Stone",
  },
  {
    name: "Science",
    nextClass: "Thu 11:15",
    teacher: "Ms. Ava Fernando",
  },
  {
    name: "ICT",
    nextClass: "Fri 08:30",
    teacher: "Mr. Dilan Perera",
  },
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
    <Card className="border-border/60 bg-card/90 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-heading text-xl font-semibold text-brand-ink sm:text-2xl">{value}</p>
          <p className="mt-1 text-xs text-brand-muted">{note}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-2.5 text-primary sm:p-3">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function SubjectCard({
  name,
  nextClass,
  teacher,
}: {
  name: string;
  nextClass: string;
  teacher: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/35 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-brand-ink">{name}</p>
          <p className="mt-1 text-sm text-brand-muted">{teacher}</p>
        </div>
        <Badge variant="outline" className="rounded-full border-border/70 bg-background/80 text-xs">
          {nextClass}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-brand-muted">You are enrolled in this subject for the current term.</p>
    </div>
  );
}

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  await requireDashboardRole(supabase, "student");

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:gap-6">
        <Card className="relative overflow-hidden border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_75%_25%,rgba(59,130,246,0.14),transparent_55%),radial-gradient(circle_at_10%_70%,rgba(16,185,129,0.12),transparent_45%)] lg:block" />
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
            <CardTitle className="max-w-2xl text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl lg:text-4xl">
              See the key updates for your school day in one place.
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-brand-muted">
              This space keeps your subjects, next lessons, and report card actions easy to find.
            </CardDescription>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="h-11 justify-between rounded-2xl px-4">
                Open report card
                <FileText className="size-4" />
              </Button>
              <Button variant="outline" className="h-11 justify-between rounded-2xl px-4">
                Subjects overview
                <BookOpen className="size-4" />
              </Button>
            </div>
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
              <p className="mt-1 text-sm leading-6 text-brand-muted">Friday, 09:00. Prepare chapters 4 to 6.</p>
            </div>
            <Button className="w-full justify-between rounded-2xl h-11">
              Open report card
              <FileText className="size-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between rounded-2xl h-11">
              View attendance history
              <TrendingUp className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {studentStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <Tabs defaultValue="snapshot" className="gap-4">
          <TabsList className="flex w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/90 p-1 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
            <TabsTrigger value="snapshot" className="shrink-0 rounded-xl px-4 py-2 text-sm">
              <UserRound className="size-4" />
              Snapshot
            </TabsTrigger>
            <TabsTrigger value="subjects" className="shrink-0 rounded-xl px-4 py-2 text-sm">
              <BookMarked className="size-4" />
              My subjects
            </TabsTrigger>
            <TabsTrigger value="grades" className="shrink-0 rounded-xl px-4 py-2 text-sm">
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
                    A quick look at what matters most right now.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Subject load", "6 subjects this term."],
                    ["Next lesson", "Mathematics on Friday morning."],
                    ["Progress note", "Mathematics is moving well."],
                    ["Report status", "Your latest report card is ready."],
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
                  <CardDescription>Two simple steps to keep you on track.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="font-medium text-brand-ink">Review Science notes</p>
                    <p className="mt-1 text-sm leading-6 text-brand-muted">Before tomorrow&apos;s class.</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="font-medium text-brand-ink">Complete English assignment</p>
                    <p className="mt-1 text-sm leading-6 text-brand-muted">Upload the final draft by 4 PM.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <Card className="border-border/60 bg-card/90">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-brand-ink">My subjects</CardTitle>
                  <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-xs">
                    {mySubjects.length} this term
                  </Badge>
                </div>
                <CardDescription>
                  Your subjects, teachers, and next class times.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-3 md:hidden">
                  {mySubjects.map((subject) => (
                    <SubjectCard key={subject.name} {...subject} />
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <Table className="min-w-176">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Next class</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mySubjects.map((subject) => (
                        <TableRow key={subject.name}>
                          <TableCell className="font-medium text-brand-ink">{subject.name}</TableCell>
                          <TableCell>{subject.teacher}</TableCell>
                          <TableCell>{subject.nextClass}</TableCell>
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
                <CardDescription>Short results from your latest report card.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:hidden">
                  {resultRows.map(([subject, percentage, grade, status]) => (
                    <div key={subject} className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                      <p className="font-medium text-brand-ink">{subject}</p>
                      <p className="mt-1 text-sm text-brand-muted">{percentage} · {grade}</p>
                      <p className="text-sm text-brand-muted">{status}</p>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <Table className="min-w-176">
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

        <aside className="order-last space-y-4 xl:order-0">
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-brand-ink">Progress notes</CardTitle>
              <CardDescription>Short notes to help you stay focused.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-brand-muted">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 leading-6">
                English is your strongest subject right now.
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 leading-6">
                Science still needs one more practical score.
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 leading-6">
                One assessment is still waiting for a teacher update.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-brand-ink">Fast actions</CardTitle>
              <CardDescription>Simple entry points for your own records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="h-11 w-full justify-between rounded-2xl">
                Open my report card
                <FileText className="size-4" />
              </Button>
              <Button variant="outline" className="h-11 w-full justify-between rounded-2xl">
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
