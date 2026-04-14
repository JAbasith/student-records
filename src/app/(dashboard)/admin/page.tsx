import {
  BarChart3,
  ChevronRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  School,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { requireDashboardRole } from "@/features/auth/server/dashboard-access";
import { createClient } from "@/lib/supabase/server";

const adminStats = [
  {
    label: "Allowlist entries",
    value: "248",
    delta: "+18 this week",
    icon: ShieldCheck,
  },
  {
    label: "Active sections",
    value: "36",
    delta: "4 new this year",
    icon: School,
  },
  {
    label: "Assessments locked",
    value: "12",
    delta: "2 ready to publish",
    icon: ClipboardList,
  },
  {
    label: "Reports generated",
    value: "1,482",
    delta: "Cached from term results",
    icon: BarChart3,
  },
];

const allowlistRows = [
  {
    name: "A. Perera",
    email: "amali.perera@school.edu",
    role: "teacher",
    identity: "EMP-1044",
    status: "active",
  },
  {
    name: "N. Silva",
    email: "nimal.silva@school.edu",
    role: "student",
    identity: "ADM-2201",
    status: "active",
  },
  {
    name: "School Office",
    email: "office@school.edu",
    role: "admin",
    identity: "primary operator",
    status: "inactive",
  },
];

const academicCards = [
  {
    title: "Academic Year",
    value: "2025 / 2026",
    caption: "Active across Grade 1 to Year 13",
  },
  {
    title: "Current Term",
    value: "Term 2",
    caption: "12 assessments linked to cached results",
  },
  {
    title: "Grade Bands",
    value: "Primary / Secondary / A-L",
    caption: "Structured for section templates",
  },
];

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-brand-ink">{value}</p>
          <p className="mt-1 text-xs text-brand-muted">{delta}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActionDialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger className={buttonVariants({ variant: "default", size: "default" })}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-border/70 bg-popover/95 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  await requireDashboardRole(supabase, "admin");

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="relative overflow-hidden border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_70%_30%,rgba(37,99,235,0.15),transparent_65%),radial-gradient(circle_at_10%_80%,rgba(14,165,233,0.12),transparent_45%)]" />
          <CardHeader className="relative z-10 gap-4 pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="mr-1.5 size-3.5" />
                School operations center
              </Badge>
              <Badge className="rounded-full bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
                Admin only
              </Badge>
            </div>

            <div className="space-y-2">
              <CardTitle className="max-w-2xl text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
                Run school administration from one control surface.
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 text-brand-muted">
                Manage allowlists, academic structure, curriculum, assessments, and term reporting with a layout that is fast to scan and hard to misread.
              </CardDescription>
            </div>

            <CardAction className="relative z-10 col-start-auto row-span-1 row-start-auto self-start justify-self-start">
              <div className="flex flex-wrap gap-2">
                <ActionDialog
                  trigger={
                    <span className="inline-flex items-center gap-2">
                      <Plus className="size-4" />
                      New allowlist entry
                    </span>
                  }
                  title="Create allowlist entry"
                  description="Add a single user and enforce school-scoped role constraints before login is permitted."
                >
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="allowlist-email">Email</Label>
                        <Input id="allowlist-email" placeholder="teacher@school.edu" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Role</Label>
                        <Select defaultValue="teacher">
                          <SelectTrigger>
                            <SelectValue placeholder="Choose role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="allowlist-name">Full name</Label>
                        <Input id="allowlist-name" placeholder="Amali Perera" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="allowlist-employee">Employee / admission no.</Label>
                        <Input id="allowlist-employee" placeholder="EMP-1044 or ADM-2201" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                      <Button type="button">Save entry</Button>
                    </DialogFooter>
                  </div>
                </ActionDialog>

                <ActionDialog
                  trigger={
                    <span className="inline-flex items-center gap-2">
                      <FileSpreadsheet className="size-4" />
                      Bulk CSV upload
                    </span>
                  }
                  title="Upload allowlist CSV"
                  description="Paste parsed CSV rows here. Duplicate emails, invalid roles, or missing IDs will reject the whole batch."
                >
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="allowlist-csv">CSV payload</Label>
                      <Textarea
                        id="allowlist-csv"
                        className="min-h-40"
                        defaultValue={`email,role,full_name,employee_no,admission_no,is_active\nteacher@school.edu,teacher,A. Perera,EMP-1044,,true\nstudent@school.edu,student,N. Silva,,ADM-2201,true`}
                      />
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/50 p-3 text-sm text-muted-foreground">
                      Import is transactional. One invalid row rolls back the entire batch.
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                      <Button type="button">Validate upload</Button>
                    </DialogFooter>
                  </div>
                </ActionDialog>
              </div>
            </CardAction>
          </CardHeader>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-brand-ink">Live control strip</CardTitle>
            <CardDescription>
              Fast entry points for the admin workflows you use most.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="#allowlist" className="group flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 transition-colors hover:bg-muted">
              <div>
                <p className="font-medium text-brand-ink">Access control</p>
                <p className="text-sm text-brand-muted">Allowlist, activation, and search</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/admin/users" className="group flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 transition-colors hover:bg-muted">
              <div>
                <p className="font-medium text-brand-ink">User management</p>
                <p className="text-sm text-brand-muted">Unified students, teachers, and admins view</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/admin/academic" className="group flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 transition-colors hover:bg-muted">
              <div>
                <p className="font-medium text-brand-ink">Academic setup</p>
                <p className="text-sm text-brand-muted">Subject catalog, assignments, and enrollment</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="#reporting" className="group flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 transition-colors hover:bg-muted">
              <div>
                <p className="font-medium text-brand-ink">Reporting cache</p>
                <p className="text-sm text-brand-muted">Recompute and export term results</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <Tabs defaultValue="overview" className="gap-4">
          <TabsList className="w-full justify-start gap-1 rounded-2xl border border-border/70 bg-card/90 p-1">
            <TabsTrigger value="overview" className="rounded-xl px-4 py-2">
              <LayoutDashboard className="size-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="allowlist" className="rounded-xl px-4 py-2">
              <ShieldCheck className="size-4" />
              Allowlist
            </TabsTrigger>
            <TabsTrigger value="academics" className="rounded-xl px-4 py-2">
              <GraduationCap className="size-4" />
              Academics
            </TabsTrigger>
            <TabsTrigger value="reporting" className="rounded-xl px-4 py-2">
              <BarChart3 className="size-4" />
              Reporting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-brand-ink">Operational map</CardTitle>
                  <CardDescription>
                    The admin workspace is organized around the actual transaction boundaries in the schema.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Allowlist", "Single insert, bulk import, search, activate, delete."],
                    ["People", "Students and teachers linked to profiles and school scope."],
                    ["Academics", "Years, terms, grades, sections, and active-state controls."],
                    ["Reports", "Cached term results, subject performance, and attendance summaries."],
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
                  <CardTitle className="text-brand-ink">Today’s queue</CardTitle>
                  <CardDescription>High-priority tasks that keep the school data model healthy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    ["Review new allowlist requests", "7 pending", "15 min"],
                    ["Activate next term", "Term 3 draft", "Atomic switch"],
                    ["Recompute locked assessments", "2 classes", "After grading"],
                  ].map(([title, meta, eta]) => (
                    <div key={title} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
                      <div>
                        <p className="font-medium text-brand-ink">{title}</p>
                        <p className="text-sm text-brand-muted">{meta}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs text-muted-foreground">
                        {eta}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent id="allowlist" value="allowlist" className="space-y-4">
            <Card className="border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle className="text-brand-ink">Allowlist management</CardTitle>
                <CardDescription>
                  Every row is school-scoped, role-validated, and ready for transaction-safe bulk import.
                </CardDescription>
                <CardAction>
                  <Button variant="outline" className="gap-2">
                    <Filter className="size-4" />
                    Filter
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Identity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allowlistRows.map((row) => (
                      <TableRow key={row.email}>
                        <TableCell className="font-medium text-brand-ink">{row.name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-full capitalize">
                            {row.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.identity}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === "active" ? "default" : "outline"} className="rounded-full capitalize">
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuLabel>Entry actions</DropdownMenuLabel>
                              <DropdownMenuItem>Update entry</DropdownMenuItem>
                              <DropdownMenuItem>Toggle active state</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academics" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {academicCards.map((item) => (
                <Card key={item.title} className="border-border/60 bg-card/90">
                  <CardHeader>
                    <CardDescription>{item.title}</CardDescription>
                    <CardTitle className="text-xl text-brand-ink">{item.value}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-brand-muted">{item.caption}</CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)]">
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-brand-ink">Section templates</CardTitle>
                  <CardDescription>
                    Bulk-create sections for the next academic year using grade-level templates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Grade 6", "A / B / C"],
                    ["Form 3", "Science / Commerce"],
                    ["Year 12", "Stream-based"],
                    ["Primary 5", "A / B"],
                  ].map(([grade, sections]) => (
                    <div key={grade} className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                      <p className="font-medium text-brand-ink">{grade}</p>
                      <p className="mt-1 text-sm text-brand-muted">{sections}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-brand-ink">Active switches</CardTitle>
                  <CardDescription>Use one atomic action per school to avoid state drift.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-between bg-primary text-primary-foreground hover:bg-primary/90">
                    Set active year
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    Set active term
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button variant="secondary" className="w-full justify-between">
                    Bulk create sections
                    <ChevronRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent id="reporting" value="reporting" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)]">
              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-brand-ink">Reporting cache</CardTitle>
                  <CardDescription>
                    Term results are precomputed so dashboards and report cards do not pay the aggregation cost repeatedly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    ["Student report card", "Uses cached term_results by enrollment and term."],
                    ["Class summary", "Rolls up subject performance for a section."],
                    ["Subject performance", "Ranks learners by subject offering."],
                    ["Attendance summary", "Fast section-day attendance aggregation."],
                  ].map(([title, copy]) => (
                    <div key={title} className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-brand-ink">{title}</p>
                        <Badge variant="outline" className="rounded-full text-xs">
                          Ready
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-brand-muted">{copy}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-brand-ink">Admin exports</CardTitle>
                  <CardDescription>Pull the data you need without leaving the dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-between">
                    <Download className="size-4" />
                    Export report cards
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    <RefreshCcw className="size-4" />
                    Recompute term results
                  </Button>
                  <Button variant="secondary" className="w-full justify-between">
                    <UserRoundSearch className="size-4" />
                    Search school records
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <aside className="space-y-4">
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-brand-ink">System notes</CardTitle>
              <CardDescription>What the current schema and RPC contract are optimized for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-brand-muted">
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                Transactions are preferred for allowlist imports, year activation, and recompute jobs.
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                Admin screens should validate school scope before showing any row-level actions.
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                Reporting views should stay read-heavy and lean on cached summaries.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-brand-ink">Quick links</CardTitle>
              <CardDescription>Jump to the major administration areas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                ["Users", "Students and teachers"],
                ["Academics", "Years, terms, sections"],
                ["Curriculum", "Subjects and offerings"],
                ["Assessment", "Lock and recompute"],
              ].map(([label, copy]) => (
                <Link key={label} href="#" className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 transition-colors hover:bg-muted">
                  <div>
                    <p className="font-medium text-brand-ink">{label}</p>
                    <p className="text-sm text-brand-muted">{copy}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
