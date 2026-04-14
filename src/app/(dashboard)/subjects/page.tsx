import { BookMarked, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireDashboardRole } from "@/features/auth/server/dashboard-access";
import { SubjectRowActions } from "@/features/subjects/subject-row-actions";
import { createClient } from "@/lib/supabase/server";

type SchoolProfile = {
  school_id: number;
};

type ActiveAcademicYear = {
  id: number;
  name: string;
};

type StudentRecord = {
  id: number;
};

type EnrollmentRecord = {
  id: number;
};

type SubjectEnrollmentRecord = {
  subject_offering_id: number;
  student_enrollment_id: number;
};

type SubjectOfferingRecord = {
  id: number;
  subject_id: number;
};

type SubjectRecord = {
  code: string | null;
  id: number;
  name: string;
};

type TeacherAssignmentRecord = {
  subject_offering_id: number;
  teacher_id: number;
};

type TeacherRecord = {
  employee_no: string;
  id: number;
  profile_id: string | null;
};

type ProfileRecord = {
  full_name: string | null;
  id: string;
};

type TermResultRecord = {
  computed_at: string | null;
  grade: string | null;
  obtained_marks: number | null;
  student_enrollment_id: number;
  subject_offering_id: number;
  total_marks: number | null;
};

type SubjectViewRow = {
  grade: string;
  marksText: string;
  subjectName: string;
  teacherEmployeeNo: string | null;
  teacherName: string;
};

async function getStudentSubjectRows(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { academicYearName: null, rows: [] as SubjectViewRow[] };
  }

  const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).maybeSingle();
  if (!profile) {
    return { academicYearName: null, rows: [] as SubjectViewRow[] };
  }

  const schoolProfile = profile as SchoolProfile;

  const [studentResponse, academicYearResponse] = await Promise.all([
    supabase.from("students").select("id").eq("profile_id", user.id).maybeSingle(),
    supabase.from("academic_years").select("id, name").eq("school_id", schoolProfile.school_id).eq("is_active", true).maybeSingle(),
  ]);

  const student = studentResponse.data as StudentRecord | null;
  const academicYear = academicYearResponse.data as ActiveAcademicYear | null;

  if (!student || !academicYear) {
    return { academicYearName: academicYear?.name || null, rows: [] as SubjectViewRow[] };
  }

  const { data: enrollmentData } = await supabase
    .from("student_enrollments")
    .select("id")
    .eq("student_id", student.id)
    .eq("academic_year_id", academicYear.id);

  const enrollments = (enrollmentData || []) as EnrollmentRecord[];
  if (enrollments.length === 0) {
    return { academicYearName: academicYear.name, rows: [] as SubjectViewRow[] };
  }

  const enrollmentIds = enrollments.map((enrollment) => enrollment.id);

  const [subjectEnrollmentResponse, offeringResponse, subjectResponse, assignmentResponse, teacherResponse, profileResponse, resultResponse] =
    await Promise.all([
      supabase
        .from("student_subject_enrollments")
        .select("student_enrollment_id, subject_offering_id")
        .in("student_enrollment_id", enrollmentIds),
      supabase.from("subject_offerings").select("id, subject_id").eq("school_id", schoolProfile.school_id),
      supabase.from("subjects").select("id, name, code").eq("school_id", schoolProfile.school_id),
      supabase.from("teacher_assignments").select("subject_offering_id, teacher_id").eq("school_id", schoolProfile.school_id),
      supabase.from("teachers").select("id, employee_no, profile_id").eq("school_id", schoolProfile.school_id),
      supabase.from("profiles").select("id, full_name").eq("school_id", schoolProfile.school_id),
      supabase
        .from("term_results")
        .select("student_enrollment_id, subject_offering_id, total_marks, obtained_marks, grade, computed_at")
        .in("student_enrollment_id", enrollmentIds),
    ]);

  const subjectEnrollments = (subjectEnrollmentResponse.data || []) as SubjectEnrollmentRecord[];
  const offerings = (offeringResponse.data || []) as SubjectOfferingRecord[];
  const subjects = (subjectResponse.data || []) as SubjectRecord[];
  const assignments = (assignmentResponse.data || []) as TeacherAssignmentRecord[];
  const teachers = (teacherResponse.data || []) as TeacherRecord[];
  const profiles = (profileResponse.data || []) as ProfileRecord[];
  const results = (resultResponse.data || []) as TermResultRecord[];

  const subjectById = new Map<number, SubjectRecord>(subjects.map((subject) => [subject.id, subject]));
  const offeringById = new Map<number, SubjectOfferingRecord>(offerings.map((offering) => [offering.id, offering]));
  const teacherById = new Map<number, TeacherRecord>(teachers.map((teacher) => [teacher.id, teacher]));
  const profileById = new Map<string, ProfileRecord>(profiles.map((profileRow) => [profileRow.id, profileRow]));
  const assignmentByOfferingId = new Map<number, TeacherAssignmentRecord>();

  for (const assignment of assignments) {
    if (!assignmentByOfferingId.has(assignment.subject_offering_id)) {
      assignmentByOfferingId.set(assignment.subject_offering_id, assignment);
    }
  }

  const resultByKey = new Map<string, TermResultRecord>();
  for (const result of results) {
    const key = `${result.student_enrollment_id}-${result.subject_offering_id}`;
    const existing = resultByKey.get(key);

    if (!existing || (existing.computed_at || "") < (result.computed_at || "")) {
      resultByKey.set(key, result);
    }
  }

  const rows = subjectEnrollments
    .map((subjectEnrollment) => {
      const offering = offeringById.get(subjectEnrollment.subject_offering_id);
      const subject = offering ? subjectById.get(offering.subject_id) : null;

      if (!offering || !subject) {
        return null;
      }

      const assignment = assignmentByOfferingId.get(offering.id);
      const teacher = assignment ? teacherById.get(assignment.teacher_id) : null;
      const teacherName = teacher?.profile_id ? profileById.get(teacher.profile_id)?.full_name || null : null;
      const result = resultByKey.get(`${subjectEnrollment.student_enrollment_id}-${offering.id}`);

      if (!result) {
        return {
          grade: "Pending",
          marksText: "Pending",
          subjectName: subject.name,
          teacherEmployeeNo: teacher?.employee_no || null,
          teacherName: teacherName || "Teacher not assigned",
        } satisfies SubjectViewRow;
      }

      return {
        grade: result.grade || "Pending",
        marksText: result.obtained_marks !== null && result.total_marks !== null ? `${result.obtained_marks}/${result.total_marks}` : "Pending",
        subjectName: subject.name,
        teacherEmployeeNo: teacher?.employee_no || null,
        teacherName: teacherName || "Teacher not assigned",
      } satisfies SubjectViewRow;
    })
    .filter((row): row is SubjectViewRow => row !== null)
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  return {
    academicYearName: academicYear.name,
    rows,
  };
}

export default async function SubjectsPage() {
  const supabase = await createClient();
  await requireDashboardRole(supabase, "student");

  const { academicYearName, rows } = await getStudentSubjectRows(supabase);
  const activeSubjectCount = rows.length;
  const latestResult = rows[0] || null;

  return (
    <div className="space-y-5 pb-6 sm:space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="border-border/60 bg-card/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <CardHeader className="space-y-4">
            <Badge variant="outline" className="w-fit rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <BookMarked className="mr-1.5 size-3.5" />
              My subjects
            </Badge>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">
                Your enrolled subjects.
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 text-brand-muted">
                Check what you are taking, who teaches it, and your latest result.
              </CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="h-11 justify-between rounded-2xl px-4">
                View report card
                <Trophy className="size-4" />
              </Button>
              <Button variant="outline" className="h-11 justify-between rounded-2xl px-4">
                Open marks
                <BookMarked className="size-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-brand-ink">At a glance</CardTitle>
            <CardDescription>What you need right now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="font-medium text-brand-ink">{activeSubjectCount} subjects</p>
              <p className="mt-1 text-sm text-brand-muted">These subjects are linked to your account.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="font-medium text-brand-ink">Latest result</p>
              <p className="mt-1 text-sm text-brand-muted">
                {latestResult ? `${latestResult.subjectName} · ${latestResult.marksText} · ${latestResult.grade}` : "No marks are available yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-brand-ink">Enrolled subjects</CardTitle>
          <CardDescription>
            {academicYearName ? `Current academic year: ${academicYearName}` : "Your current academic year."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-sm text-brand-muted">
              No subjects are linked to your account yet.
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {rows.map((subject) => (
                  <div key={subject.subjectName} className="rounded-2xl border border-border/70 bg-muted/35 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-brand-ink">{subject.subjectName}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-border/70 bg-background/80 text-xs">
                          {subject.grade}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-brand-muted">
                        <p>
                          <span className="font-medium text-brand-ink">Teacher:</span> {subject.teacherName}
                        </p>
                        <p>
                          <span className="font-medium text-brand-ink">Result:</span> {subject.marksText}
                        </p>
                      </div>

                      <SubjectRowActions
                        grade={subject.grade}
                        marksText={subject.marksText}
                        subjectName={subject.subjectName}
                        teacherEmployeeNo={subject.teacherEmployeeNo}
                        teacherName={subject.teacherName}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-176">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Latest result</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((subject) => (
                      <TableRow key={subject.subjectName}>
                        <TableCell className="font-medium text-brand-ink">{subject.subjectName}</TableCell>
                        <TableCell>{subject.teacherName}</TableCell>
                        <TableCell>{subject.marksText}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full border-border/70 bg-background/80 px-3 py-1 text-xs">
                            {subject.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <SubjectRowActions
                            grade={subject.grade}
                            marksText={subject.marksText}
                            subjectName={subject.subjectName}
                            teacherEmployeeNo={subject.teacherEmployeeNo}
                            teacherName={subject.teacherName}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-brand-ink">Quick note</CardTitle>
          <CardDescription>Use the teacher and mark buttons to check details quickly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm leading-6 text-brand-muted">
            <Trophy className="size-4 text-primary" />
            Teacher details and marks are one tap away.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}