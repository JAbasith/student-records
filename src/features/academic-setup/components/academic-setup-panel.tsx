"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AcademicStructureCard } from "@/features/academic-setup/features/academic-structure/components";
import { AcademicYearCard } from "@/features/academic-setup/features/academic-year/components";
import { StudentEnrollmentCard } from "@/features/academic-setup/features/student-enrollment/components";
import { SubjectCatalogCard } from "@/features/academic-setup/features/subject-catalog/components";
import { TeacherAssignmentCard } from "@/features/academic-setup/features/teacher-assignment/components";
import type { AcademicSetupData } from "@/features/academic-setup/shared/types";

type AcademicSetupPanelProps = {
  data: AcademicSetupData;
};

export function AcademicSetupPanel({ data }: Readonly<AcademicSetupPanelProps>) {

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AcademicYearCard
          academicYears={data.academicYears}
          activeYearId={data.activeAcademicYearId}
          activeYearName={data.activeAcademicYearName || "Not set"}
        />
        <Card className="border-border/60 bg-card/90">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Subjects</p>
            <p className="mt-1 text-lg font-semibold text-brand-ink">{data.stats.subjectsCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/90">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Offerings</p>
            <p className="mt-1 text-lg font-semibold text-brand-ink">{data.stats.offeringsCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/90">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Student subject enrollments</p>
            <p className="mt-1 text-lg font-semibold text-brand-ink">{data.stats.studentSubjectEnrollmentsCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-1">
        <AcademicStructureCard classSections={data.classSections} gradeLevels={data.gradeLevels} />
      </section>

      {/* Feature Cards */}
      <section className="grid gap-6 xl:grid-cols-1">
        <SubjectCatalogCard subjects={data.subjects} classSections={data.classSections} offerings={data.offerings} />
        <TeacherAssignmentCard offerings={data.offerings} teachers={data.teachers} />
      </section>

      {/* Enrollment Cards */}
      <section className="grid gap-6 xl:grid-cols-2">
        <StudentEnrollmentCard offerings={data.offerings} studentEnrollments={data.enrollments} />
        <Card className="border-border/60 bg-card/90">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Bulk pattern
              </Badge>
            </div>
            <p className="font-semibold text-brand-ink mb-2">Bulk enrollment reference</p>
            <p className="text-sm text-brand-muted">
              Use the bulk enrollment tab for scale: pick one offering and enroll every student in that section with one action.
            </p>
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm text-brand-muted mt-4">
              For 1000+ students: create offerings by section once, then bulk enroll each section. Use single-student form only for electives and changes.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
