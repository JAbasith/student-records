import type { createClient } from "@/lib/supabase/server";

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

export type SubjectViewRow = {
  grade: string;
  marksText: string;
  subjectName: string;
  teacherEmployeeNo: string | null;
  teacherName: string;
};

export async function getStudentSubjectRows(supabase: Awaited<ReturnType<typeof createClient>>) {
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
