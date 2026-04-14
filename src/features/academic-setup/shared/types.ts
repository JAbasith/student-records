// Shared types across all academic setup features

export type ActionResult = {
  message?: string;
  success: boolean;
};

// Academic Year Types
export type AcademicYear = {
  id: number;
  isActive: boolean;
  name: string;
};

export type ActiveAcademicYear = {
  id: number;
  name: string;
};

// Subject Types
export type Subject = {
  code: string | null;
  id: number;
  label: string;
};

// Class Section Types
export type ClassSection = {
  id: number;
  label: string;
};

// Grade Level Types
export type GradeLevel = {
  id: number;
  name: string;
};

// Teacher Types
export type Teacher = {
  id: number;
  label: string;
};

// Offering Types
export type Offering = {
  assignmentCount: number;
  enrollmentCount: number;
  id: number;
  label: string;
  sectionKey: string;
  subjectCode: string | null;
};

// Student Enrollment Types
export type StudentEnrollment = {
  id: number;
  label: string;
};

// Combined setup data type
export type AcademicSetupData = {
  academicYears: Array<AcademicYear>;
  activeAcademicYearId: number | null;
  activeAcademicYearName: string | null;
  classSections: Array<ClassSection>;
  gradeLevels: Array<GradeLevel>;
  enrollments: Array<StudentEnrollment>;
  offerings: Array<Offering>;
  stats: {
    offeringsCount: number;
    studentSubjectEnrollmentsCount: number;
    subjectsCount: number;
    teacherAssignmentsCount: number;
  };
  subjects: Array<Subject>;
  teachers: Array<Teacher>;
};
