import { createClient } from "@/lib/supabase/server";

type SubjectRow = {
  code: string | null;
  id: number;
  name: string;
};

type ClassSectionRow = {
  id: number;
  name: string;
  grade_level_id: number;
};

type GradeLevelRow = {
  id: number;
  name: string;
};

type OfferingViewRow = {
  academic_year_id: number;
  academic_year_name: string;
  grade_name: string;
  section_name: string;
  subject_code: string | null;
  subject_name: string;
  subject_offering_id: number;
};

type TeacherRow = {
  employee_no: string;
  id: number;
  profile_id: string | null;
};

type ProfileRow = {
  full_name: string | null;
  id: string;
};

type ActiveEnrollmentRow = {
  academic_year_name: string | null;
  enrollment_id: number;
  grade_name: string | null;
  section_name: string | null;
  student_name: string | null;
  admission_no: string;
};

type SubjectEnrollmentRow = {
  student_enrollment_id: number;
  subject_offering_id: number;
};

type TeacherAssignmentRow = {
  subject_offering_id: number;
};

type SchoolProfile = {
  school_id: number;
};

type ActiveAcademicYear = {
  id: number;
  name: string;
};

export type AcademicSetupData = {
  academicYears: Array<{ id: number; isActive: boolean; name: string }>;
  activeAcademicYearId: number | null;
  activeAcademicYearName: string | null;
  classSections: Array<{ id: number; label: string }>;
  gradeLevels: Array<{ id: number; name: string }>;
  enrollments: Array<{ id: number; label: string }>;
  offerings: Array<{
    assignmentCount: number;
    enrollmentCount: number;
    id: number;
    label: string;
    sectionKey: string;
    subjectCode: string | null;
  }>;
  stats: {
    offeringsCount: number;
    studentSubjectEnrollmentsCount: number;
    subjectsCount: number;
    teacherAssignmentsCount: number;
  };
  subjects: Array<{ code: string | null; id: number; label: string }>;
  teachers: Array<{ id: number; label: string }>;
};

function sectionKey(gradeName: string, sectionName: string): string {
  return `${gradeName}::${sectionName}`;
}

export async function getAcademicSetupData(): Promise<AcademicSetupData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      academicYears: [],
      activeAcademicYearId: null,
      activeAcademicYearName: null,
      classSections: [],
      gradeLevels: [],
      enrollments: [],
      offerings: [],
      stats: {
        offeringsCount: 0,
        studentSubjectEnrollmentsCount: 0,
        subjectsCount: 0,
        teacherAssignmentsCount: 0,
      },
      subjects: [],
      teachers: [],
    };
  }

  const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).maybeSingle();
  if (!profile) {
    return {
      academicYears: [],
      activeAcademicYearId: null,
      activeAcademicYearName: null,
      classSections: [],
      gradeLevels: [],
      enrollments: [],
      offerings: [],
      stats: {
        offeringsCount: 0,
        studentSubjectEnrollmentsCount: 0,
        subjectsCount: 0,
        teacherAssignmentsCount: 0,
      },
      subjects: [],
      teachers: [],
    };
  }

  const schoolProfile = profile as SchoolProfile;

  const { data: activeAcademicYearData, error: activeAcademicYearError } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("school_id", schoolProfile.school_id)
    .eq("is_active", true)
    .limit(1);

  if (activeAcademicYearError) {
    throw new Error(
      `Failed to load active academic year for school ${schoolProfile.school_id}: ${activeAcademicYearError.message}`,
    );
  }

  const activeAcademicYear = (activeAcademicYearData?.[0] || null) as ActiveAcademicYear | null;

  const [
    subjectsResponse,
    offeringViewResponse,
    teachersResponse,
    profilesResponse,
    enrollmentsResponse,
    subjectEnrollmentResponse,
    assignmentResponse,
    classSectionResponse,
    gradeLevelResponse,
    academicYearsResponse,
  ] = await Promise.all([
    supabase.from("subjects").select("id, name, code").eq("school_id", schoolProfile.school_id),
    supabase
      .from("v_subject_offerings")
      .select("subject_offering_id, subject_name, subject_code, section_name, grade_name, academic_year_id, academic_year_name")
      .eq("school_id", schoolProfile.school_id),
    supabase.from("teachers").select("id, employee_no, profile_id").eq("school_id", schoolProfile.school_id),
    supabase.from("profiles").select("id, full_name").eq("school_id", schoolProfile.school_id),
    supabase.from("v_active_enrollments").select("enrollment_id, student_name, admission_no, section_name, grade_name, academic_year_name").eq("school_id", schoolProfile.school_id),
    supabase.from("student_subject_enrollments").select("student_enrollment_id, subject_offering_id").eq("school_id", schoolProfile.school_id),
    supabase.from("teacher_assignments").select("subject_offering_id").eq("school_id", schoolProfile.school_id),
    supabase
      .from("class_sections")
      .select("id, name, grade_level_id")
      .eq("school_id", schoolProfile.school_id)
      .eq("academic_year_id", activeAcademicYear?.id || -1),
    supabase.from("grade_levels").select("id, name").eq("school_id", schoolProfile.school_id),
    supabase.from("academic_years").select("id, name, is_active").eq("school_id", schoolProfile.school_id).order("id", { ascending: false }),
  ]);

  const subjects = (subjectsResponse.data || []) as SubjectRow[];
  const offeringViewRows = (offeringViewResponse.data || []) as OfferingViewRow[];
  const teachers = (teachersResponse.data || []) as TeacherRow[];
  const profiles = (profilesResponse.data || []) as ProfileRow[];
  const enrollments = (enrollmentsResponse.data || []) as ActiveEnrollmentRow[];
  const subjectEnrollments = (subjectEnrollmentResponse.data || []) as SubjectEnrollmentRow[];
  const assignments = (assignmentResponse.data || []) as TeacherAssignmentRow[];
  const classSections = (classSectionResponse.data || []) as ClassSectionRow[];
  const gradeLevels = (gradeLevelResponse.data || []) as GradeLevelRow[];

  const profileById = new Map<string, ProfileRow>(profiles.map((row) => [row.id, row]));
  const gradeById = new Map<number, GradeLevelRow>(gradeLevels.map((row) => [row.id, row]));

  const assignmentCountByOffering = new Map<number, number>();
  for (const assignment of assignments) {
    assignmentCountByOffering.set(
      assignment.subject_offering_id,
      (assignmentCountByOffering.get(assignment.subject_offering_id) || 0) + 1,
    );
  }

  const enrollmentCountByOffering = new Map<number, number>();
  for (const row of subjectEnrollments) {
    enrollmentCountByOffering.set(row.subject_offering_id, (enrollmentCountByOffering.get(row.subject_offering_id) || 0) + 1);
  }

  const subjectOptions = subjects
    .map((subject) => ({
      code: subject.code,
      id: subject.id,
      label: subject.code ? `${subject.name} (${subject.code})` : subject.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const teacherOptions = teachers
    .map((teacher) => {
      const teacherName = teacher.profile_id ? profileById.get(teacher.profile_id)?.full_name || "Unnamed teacher" : "Unlinked teacher";
      return {
        id: teacher.id,
        label: `${teacherName} (${teacher.employee_no})`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const offeringOptions = offeringViewRows
    .filter((row) => (activeAcademicYear ? row.academic_year_id === activeAcademicYear.id : true))
    .map((row) => ({
      assignmentCount: assignmentCountByOffering.get(row.subject_offering_id) || 0,
      enrollmentCount: enrollmentCountByOffering.get(row.subject_offering_id) || 0,
      id: row.subject_offering_id,
      label: `${row.subject_name} (${row.grade_name} ${row.section_name})`,
      sectionKey: sectionKey(row.grade_name, row.section_name),
      subjectCode: row.subject_code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const enrollmentOptions = enrollments
    .map((enrollment) => ({
      id: enrollment.enrollment_id,
      label: `${enrollment.student_name || "Unnamed student"} (${enrollment.admission_no}) - ${enrollment.grade_name || "Unknown"} ${enrollment.section_name || ""}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const classSectionOptions = classSections
    .map((section) => {
      const gradeName = gradeById.get(section.grade_level_id)?.name || "Unknown grade";
      return {
        id: section.id,
        label: `${gradeName} ${section.name}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const gradeLevelOptions = gradeLevels
    .map((grade) => ({
      id: grade.id,
      name: grade.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    academicYears: (academicYearsResponse.data || [])
      .map((row: { id: number; name: string; is_active: boolean }) => ({
        id: row.id,
        isActive: row.is_active,
        name: row.name,
      }))
      .sort((a, b) => b.id - a.id),
    activeAcademicYearId: activeAcademicYear?.id || null,
    activeAcademicYearName: activeAcademicYear?.name || null,
    classSections: classSectionOptions,
    gradeLevels: gradeLevelOptions,
    enrollments: enrollmentOptions,
    offerings: offeringOptions,
    stats: {
      offeringsCount: offeringOptions.length,
      studentSubjectEnrollmentsCount: subjectEnrollments.length,
      subjectsCount: subjectOptions.length,
      teacherAssignmentsCount: assignments.length,
    },
    subjects: subjectOptions,
    teachers: teacherOptions,
  };
}
