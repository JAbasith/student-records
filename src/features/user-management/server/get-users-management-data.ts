import type { UserRole } from "@/features/access-control/access-control.types";
import { createClient } from "@/lib/supabase/server";

type UserStatusFilter = "all" | "active" | "inactive";

type UsersFilterInput = {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole | "all";
  status?: UserStatusFilter;
  grade?: string;
  section?: string;
  academicYear?: string;
};

export type ManagedUserRow = {
  id: string;
  fullName: string;
  role: UserRole;
  email: string | null;
  status: "active" | "inactive";
  identityNumber: string | null;
  grade: string | null;
  section: string | null;
  academicYear: string | null;
  createdAt: string | null;
};

export type UsersManagementData = {
  users: ManagedUserRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  filters: {
    search: string;
    role: UserRole | "all";
    status: UserStatusFilter;
    grade: string;
    section: string;
    academicYear: string;
  };
  options: {
    grades: string[];
    sections: string[];
    academicYears: string[];
  };
};

type ProfileRow = {
  id: string;
  role: UserRole;
  full_name: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type StudentRow = {
  id: number;
  profile_id: string | null;
  admission_no: string;
};

type TeacherRow = {
  id: number;
  profile_id: string | null;
  employee_no: string;
};

type ActiveEnrollmentRow = {
  student_id: number;
  grade_name: string | null;
  section_name: string | null;
  academic_year_name: string | null;
};

type AllowlistRow = {
  email: string;
  role: UserRole;
  admission_no: string | null;
  employee_no: string | null;
  full_name: string | null;
};

function normalize(value: string | undefined): string {
  return (value || "").trim().toLowerCase();
}

function includesValue(source: string | null | undefined, search: string): boolean {
  if (!source) {
    return false;
  }

  return source.toLowerCase().includes(search);
}

export async function getUsersManagementData(input: UsersFilterInput): Promise<UsersManagementData> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      users: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: input.pageSize,
      filters: {
        search: input.search || "",
        role: input.role || "all",
        status: input.status || "all",
        grade: input.grade || "",
        section: input.section || "",
        academicYear: input.academicYear || "",
      },
      options: { grades: [], sections: [], academicYears: [] },
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      users: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: input.pageSize,
      filters: {
        search: input.search || "",
        role: input.role || "all",
        status: input.status || "all",
        grade: input.grade || "",
        section: input.section || "",
        academicYear: input.academicYear || "",
      },
      options: { grades: [], sections: [], academicYears: [] },
    };
  }

  const schoolId = profile.school_id;

  const [profilesResponse, studentsResponse, teachersResponse, enrollmentsResponse, allowlistResponse] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, role, full_name, is_active, created_at")
      .eq("school_id", schoolId),
    supabase
      .from("students")
      .select("id, profile_id, admission_no")
      .eq("school_id", schoolId),
    supabase
      .from("teachers")
      .select("id, profile_id, employee_no")
      .eq("school_id", schoolId),
    supabase
      .from("v_active_enrollments")
      .select("student_id, grade_name, section_name, academic_year_name")
      .eq("school_id", schoolId),
    supabase
      .from("login_allowlist")
      .select("email, role, admission_no, employee_no, full_name")
      .eq("school_id", schoolId),
  ]);

  const profiles = (profilesResponse.data || []) as ProfileRow[];
  const students = (studentsResponse.data || []) as StudentRow[];
  const teachers = (teachersResponse.data || []) as TeacherRow[];
  const activeEnrollments = (enrollmentsResponse.data || []) as ActiveEnrollmentRow[];
  const allowlist = (allowlistResponse.data || []) as AllowlistRow[];

  const studentByProfile = new Map<string, StudentRow>();
  for (const student of students) {
    if (student.profile_id) {
      studentByProfile.set(student.profile_id, student);
    }
  }

  const teacherByProfile = new Map<string, TeacherRow>();
  for (const teacher of teachers) {
    if (teacher.profile_id) {
      teacherByProfile.set(teacher.profile_id, teacher);
    }
  }

  const enrollmentByStudent = new Map<number, ActiveEnrollmentRow>();
  for (const enrollment of activeEnrollments) {
    if (!enrollmentByStudent.has(enrollment.student_id)) {
      enrollmentByStudent.set(enrollment.student_id, enrollment);
    }
  }

  const studentEmailByAdmission = new Map<string, string>();
  const teacherEmailByEmployee = new Map<string, string>();
  const adminEmailByName = new Map<string, string>();

  for (const entry of allowlist) {
    if (entry.role === "student" && entry.admission_no) {
      studentEmailByAdmission.set(entry.admission_no.toLowerCase(), entry.email);
    }

    if (entry.role === "teacher" && entry.employee_no) {
      teacherEmailByEmployee.set(entry.employee_no.toLowerCase(), entry.email);
    }

    if (entry.role === "admin" && entry.full_name) {
      adminEmailByName.set(entry.full_name.toLowerCase(), entry.email);
    }
  }

  const allUsers: ManagedUserRow[] = profiles.map((item) => {
    const student = studentByProfile.get(item.id);
    const teacher = teacherByProfile.get(item.id);

    let identityNumber: string | null = null;
    let email: string | null = null;
    let grade: string | null = null;
    let section: string | null = null;
    let academicYear: string | null = null;

    if (item.role === "student" && student) {
      identityNumber = student.admission_no;
      email = studentEmailByAdmission.get(student.admission_no.toLowerCase()) || null;
      const enrollment = enrollmentByStudent.get(student.id);
      grade = enrollment?.grade_name || null;
      section = enrollment?.section_name || null;
      academicYear = enrollment?.academic_year_name || null;
    } else if (item.role === "teacher" && teacher) {
      identityNumber = teacher.employee_no;
      email = teacherEmailByEmployee.get(teacher.employee_no.toLowerCase()) || null;
    } else if (item.role === "admin") {
      const key = (item.full_name || "").toLowerCase();
      email = adminEmailByName.get(key) || null;
    }

    return {
      id: item.id,
      fullName: item.full_name || "Unnamed user",
      role: item.role,
      email,
      status: item.is_active ? "active" : "inactive",
      identityNumber,
      grade,
      section,
      academicYear,
      createdAt: item.created_at,
    };
  });

  const normalizedSearch = normalize(input.search);
  const roleFilter = input.role || "all";
  const statusFilter = input.status || "all";
  const gradeFilter = normalize(input.grade);
  const sectionFilter = normalize(input.section);
  const academicYearFilter = normalize(input.academicYear);

  const filteredUsers = allUsers.filter((row) => {
    if (roleFilter !== "all" && row.role !== roleFilter) {
      return false;
    }

    if (statusFilter !== "all" && row.status !== statusFilter) {
      return false;
    }

    if (gradeFilter && normalize(row.grade || "") !== gradeFilter) {
      return false;
    }

    if (sectionFilter && normalize(row.section || "") !== sectionFilter) {
      return false;
    }

    if (academicYearFilter && normalize(row.academicYear || "") !== academicYearFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return (
      includesValue(row.fullName, normalizedSearch) ||
      includesValue(row.email, normalizedSearch) ||
      includesValue(row.identityNumber, normalizedSearch) ||
      includesValue(row.grade, normalizedSearch) ||
      includesValue(row.section, normalizedSearch)
    );
  });

  const sortedUsers = filteredUsers.sort((a, b) => a.fullName.localeCompare(b.fullName));
  const totalCount = sortedUsers.length;
  const pageSize = input.pageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, input.page), totalPages);
  const offset = (currentPage - 1) * pageSize;
  const users = sortedUsers.slice(offset, offset + pageSize);

  const grades = Array.from(new Set(allUsers.map((userRow) => userRow.grade).filter(Boolean) as string[])).sort();
  const sections = Array.from(new Set(allUsers.map((userRow) => userRow.section).filter(Boolean) as string[])).sort();
  const academicYears = Array.from(new Set(allUsers.map((userRow) => userRow.academicYear).filter(Boolean) as string[])).sort();

  return {
    users,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    filters: {
      search: input.search || "",
      role: roleFilter,
      status: statusFilter,
      grade: input.grade || "",
      section: input.section || "",
      academicYear: input.academicYear || "",
    },
    options: {
      grades,
      sections,
      academicYears,
    },
  };
}
