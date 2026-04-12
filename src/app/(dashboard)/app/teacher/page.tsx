import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  Layers3,
  MailWarning,
  Sparkles,
  Users2,
} from "lucide-react";
import type { ComponentType } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const teacherStats = [
  { label: "Assigned sections", value: "5", note: "2 classes today", icon: Layers3 },
  { label: "Scores pending", value: "18", note: "3 assessments unlocked", icon: ClipboardList },
  { label: "Attendance completion", value: "94%", note: "Last synced 7 min ago", icon: CheckCircle2 },
  { label: "Students in scope", value: "186", note: "All within school tenant", icon: Users2 },
];

const timetable = [
  ["Grade 6A", "Mathematics", "Period 1", "Mark attendance"],
  ["Grade 6B", "Mathematics", "Period 2", "Review quiz scores"],
  ["Form 2C", "Science", "Period 4", "Publish results"],
];

const assessmentQueue = [
  ["Term 2 Mathematics Exam", "Grade 6A", "72 scripts pending"],
  ["Science quiz", "Form 2C", "12 score edits"],
  ["English assignment", "Year 10", "Ready to lock"],
];

const alertItems: Array<{ icon: ComponentType<{ className?: string }>; copy: string }> = [
  { icon: MailWarning, copy: "1 attendance correction pending approval" },
  { icon: Activity, copy: "2 score sheets still unlocked" },
  { icon: BookOpen, copy: "3 students missing subject enrollment" },
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

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card className="relative overflow-hidden border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.12),transparent_60%),radial-gradient(circle_at_10%_80%,rgba(59,130,246,0.12),transparent_45%)]" />
          <CardHeader className="relative z-10 gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="mr-1.5 size-3.5" />
                Teaching workspace
              </Badge>
              <Badge className="rounded-full bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300">
                Scope-limited access
              </Badge>
            </div>
            <CardTitle className="max-w-2xl text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Track attendance, grading, and class progress without losing the thread.
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-brand-muted">
              The teacher workspace prioritizes assigned sections, quick attendance edits, and assessment workflows tied to subject offerings.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="text-brand-ink">Today&apos;s actions</CardTitle>
            <CardDescription>What should be completed before the bell.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-between">
              Take attendance
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Review assessment queue
              <ArrowRight className="size-4" />
            </Button>
            <Dialog>
              <DialogTrigger className={buttonVariants({ variant: "secondary", size: "default" }) + " w-full justify-between"}>
                Manual correction
                <ArrowRight className="size-4" />
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Manual attendance correction</DialogTitle>
                  <DialogDescription>
                    Update a previously recorded attendance row when the original entry needs a correction.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="teacher-student">Student</Label>
                      <Input id="teacher-student" placeholder="ADM-2201 / N. Silva" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="teacher-date">Date</Label>
                      <Input id="teacher-date" type="date" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teacher-note">Reason</Label>
                    <Textarea id="teacher-note" placeholder="Parent note, medical appointment, or correction details." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button type="button">Save change</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {teacherStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <Tabs defaultValue="today" className="gap-4">
          <TabsList className="w-full justify-start gap-1 rounded-2xl border border-border/70 bg-card/90 p-1">
            <TabsTrigger value="today" className="rounded-xl px-4 py-2">
              <CalendarDays className="size-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="assessments" className="rounded-xl px-4 py-2">
              <GraduationCap className="size-4" />
              Assessments
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-xl px-4 py-2">
              <Clock3 className="size-4" />
              Attendance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-brand-ink">Schedule snapshot</CardTitle>
                <CardDescription>
                  Your assigned classes and the action you can take on each one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timetable.map(([section, subject, period, action]) => (
                      <TableRow key={`${section}-${period}`}>
                        <TableCell className="font-medium text-brand-ink">{section}</TableCell>
                        <TableCell>{subject}</TableCell>
                        <TableCell>{period}</TableCell>
                        <TableCell className="text-primary">{action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {assessmentQueue.map(([title, scope, note]) => (
                <Card key={title} className="border-border/60 bg-card/90">
                  <CardHeader>
                    <CardTitle className="text-base text-brand-ink">{title}</CardTitle>
                    <CardDescription>{scope}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <span className="text-sm text-brand-muted">{note}</span>
                    <Badge variant="outline" className="rounded-full">Open</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-brand-ink">Attendance editor</CardTitle>
                <CardDescription>
                  Edit your assigned section records while keeping the section and school scoping intact.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Grade 6A", "38 present", "2 late"],
                  ["Grade 6B", "35 present", "5 absent"],
                  ["Form 2C", "41 present", "1 excused"],
                ].map(([section, present, status]) => (
                  <div key={section} className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="font-medium text-brand-ink">{section}</p>
                    <p className="mt-1 text-sm text-brand-muted">{present}</p>
                    <p className="text-sm text-brand-muted">{status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <aside className="space-y-4">
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-brand-ink">Teaching notes</CardTitle>
              <CardDescription>Small reminders that keep the workflow clean.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-brand-muted">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                Teachers only see sections and subject offerings assigned to them.
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                Use dialogs for manual corrections so edits are explicit and auditable.
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                Lock assessments when grading is complete, then recompute term results.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-brand-ink">Alerts</CardTitle>
              <CardDescription>Issues that need a quick review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {alertItems.map(({ icon: Icon, copy }) => (
                <div key={copy} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <Icon className="mt-0.5 size-4 text-primary" />
                  <p className="text-sm text-brand-muted">{copy}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}