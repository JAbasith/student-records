import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, BookOpen, GraduationCap, Users } from "lucide-react";

export default function Home() {
  const summaryCards = [
    {
      title: "Total Students",
      value: "742",
      icon: Users,
      trend: "+4.2% this term",
    },
    {
      title: "Active Teachers",
      value: "46",
      icon: GraduationCap,
      trend: "Stable",
    },
    {
      title: "Subject Offerings",
      value: "128",
      icon: BookOpen,
      trend: "+8 new offerings",
    },
  ];

  const activities = [
    {
      event: "Term 2 Midterm marks submission",
      owner: "Grade 8 Teachers",
      status: "In progress",
    },
    {
      event: "Grade 11 enrollment reconciliation",
      owner: "Admin Team",
      status: "Review",
    },
    {
      event: "Daily attendance rollup",
      owner: "System Job",
      status: "Completed",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_40%),radial-gradient(circle_at_90%_10%,_rgba(2,132,199,0.15),_transparent_35%)]" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10">
        <section className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-sm backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">
                Academic Year 2026 / Term 2
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                Student Records Frontend Workspace
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 md:text-base">
                Professional starter dashboard built with Next.js and shadcn/ui. This workspace is
                ready for admin, teacher, and student modules.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">View Schema</Button>
              <Button>
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <Card key={card.title} className="border-slate-200/80 bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium text-slate-600">
                  {card.title}
                  <card.icon className="h-4 w-4 text-slate-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-1 text-sm text-slate-500">{card.trend}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-base text-slate-800">Operational Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.event}>
                      <TableCell className="font-medium text-slate-800">{activity.event}</TableCell>
                      <TableCell className="text-slate-600">{activity.owner}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{activity.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90">
            <CardHeader>
              <CardTitle className="text-base text-slate-800">Next Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>1. Connect authentication and role guards.</p>
              <p>2. Build master-data CRUD screens.</p>
              <p>3. Implement marks entry and reporting modules.</p>
              <Button className="mt-2 w-full" variant="outline">
                Open Delivery Plan
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
