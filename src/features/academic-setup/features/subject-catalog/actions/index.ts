"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/features/academic-setup/shared/types";
import { createClient } from "@/lib/supabase/server";

function getStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function toInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSubjectCode(code: string): string {
  return code.trim().toUpperCase();
}

async function getCurrentSchoolContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ role: "admin" | "teacher" | "student"; schoolId: number } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  const row = profile as { school_id: number; role: "admin" | "teacher" | "student" };
  return { role: row.role, schoolId: row.school_id };
}

function revalidateAcademicViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/academic");
  revalidatePath("/subjects");
}

export async function createSubjectCatalogItem(formData: FormData): Promise<ActionResult> {
  try {
    const name = getStringValue(formData.get("name"));
    const rawCode = getStringValue(formData.get("code"));
    const code = rawCode ? normalizeSubjectCode(rawCode) : "";

    if (!name) {
      return { success: false, message: "Subject name is required" };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school" };
    }

    if (context.role !== "admin") {
      return { success: false, message: "Only admins can create subjects" };
    }

    const { data: existingByName, error: existingByNameError } = await supabase
      .from("subjects")
      .select("id")
      .eq("school_id", context.schoolId)
      .ilike("name", name)
      .limit(1);

    if (existingByNameError) {
      return { success: false, message: existingByNameError.message || "Failed to validate subject name" };
    }

    if (existingByName && existingByName.length > 0) {
      return { success: false, message: "Subject name already exists" };
    }

    if (code) {
      const { data: existingByCode, error: existingByCodeError } = await supabase
        .from("subjects")
        .select("id")
        .eq("school_id", context.schoolId)
        .eq("code", code)
        .limit(1);

      if (existingByCodeError) {
        return { success: false, message: existingByCodeError.message || "Failed to validate subject code" };
      }

      if (existingByCode && existingByCode.length > 0) {
        return { success: false, message: "Subject code already exists" };
      }
    }

    const { error: insertError } = await supabase.from("subjects").insert({
      code: code || null,
      name,
      school_id: context.schoolId,
    });

    if (insertError) {
      return { success: false, message: insertError.message || "Failed to create subject" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Subject created" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while creating subject",
    };
  }
}

export async function deleteSubjectCatalogItem(formData: FormData): Promise<ActionResult> {
  try {
    const subjectId = toInteger(getStringValue(formData.get("subjectId")));

    if (!subjectId) {
      return { success: false, message: "Select a subject" };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school" };
    }

    if (context.role !== "admin") {
      return { success: false, message: "Only admins can delete subjects" };
    }

    const { data: offerings, error: offeringError } = await supabase
      .from("subject_offerings")
      .select("id")
      .eq("school_id", context.schoolId)
      .eq("subject_id", subjectId)
      .limit(1);

    if (offeringError) {
      return { success: false, message: offeringError.message || "Failed to validate subject usage" };
    }

    if (offerings && offerings.length > 0) {
      return { success: false, message: "Cannot delete subject with existing offerings" };
    }

    const { error: deleteError } = await supabase
      .from("subjects")
      .delete()
      .eq("school_id", context.schoolId)
      .eq("id", subjectId);

    if (deleteError) {
      return { success: false, message: deleteError.message || "Failed to delete subject" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Subject deleted" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while deleting subject",
    };
  }
}

export async function createSubjectOffering(formData: FormData): Promise<ActionResult> {
  try {
    const subjectId = toInteger(getStringValue(formData.get("subjectId")));
    const classSectionIds = formData
      .getAll("classSectionIds")
      .map((value) => toInteger(getStringValue(value)))
      .filter((value): value is number => value !== null);

    if (!subjectId) {
      return { success: false, message: "Select a subject" };
    }

    if (classSectionIds.length === 0) {
      return { success: false, message: "Select at least one class section" };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school" };
    }

    if (context.role !== "admin") {
      return { success: false, message: "Only admins can create subject offerings" };
    }

    const activeYearResponse = await supabase
      .from("academic_years")
      .select("id")
      .eq("school_id", context.schoolId)
      .eq("is_active", true)
      .maybeSingle();

    if (activeYearResponse.error || !activeYearResponse.data) {
      return { success: false, message: "Set an active academic year first" };
    }

    const { data: subjectRow, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .eq("school_id", context.schoolId)
      .maybeSingle();

    if (subjectError || !subjectRow) {
      return { success: false, message: "Selected subject was not found" };
    }

    const { data: validSections, error: sectionError } = await supabase
      .from("class_sections")
      .select("id")
      .eq("school_id", context.schoolId)
      .eq("academic_year_id", activeYearResponse.data.id)
      .in("id", classSectionIds);

    if (sectionError) {
      return { success: false, message: sectionError.message || "Failed to validate class sections" };
    }

    const validSectionIds = new Set((validSections || []).map((row) => row.id));
    const missingSections = classSectionIds.filter((id) => !validSectionIds.has(id));

    if (missingSections.length > 0) {
      return { success: false, message: "One or more selected class sections are invalid" };
    }

    const { data: existingOfferings, error: existingError } = await supabase
      .from("subject_offerings")
      .select("id, class_section_id")
      .eq("school_id", context.schoolId)
      .eq("subject_id", subjectId)
      .in("class_section_id", classSectionIds);

    if (existingError) {
      return { success: false, message: existingError.message || "Failed to validate existing offerings" };
    }

    const existingSectionIds = new Set((existingOfferings || []).map((row) => row.class_section_id));
    const rowsToInsert = classSectionIds
      .filter((id) => !existingSectionIds.has(id))
      .map((classSectionId) => ({
        class_section_id: classSectionId,
        school_id: context.schoolId,
        subject_id: subjectId,
      }));

    if (rowsToInsert.length === 0) {
      return { success: false, message: "That subject is already offered in the selected class sections" };
    }

    const { error: insertError } = await supabase.from("subject_offerings").insert(rowsToInsert);

    if (insertError) {
      return { success: false, message: insertError.message || "Failed to create subject offerings" };
    }

    revalidateAcademicViews();
    return {
      success: true,
      message:
        rowsToInsert.length === 1
          ? "Subject offering created"
          : `Subject offerings created for ${rowsToInsert.length} class sections`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while creating subject offerings",
    };
  }
}

export async function deleteSubjectOffering(formData: FormData): Promise<ActionResult> {
  try {
    const offeringId = toInteger(getStringValue(formData.get("offeringId")));

    if (!offeringId) {
      return { success: false, message: "Select a subject offering" };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school" };
    }

    if (context.role !== "admin") {
      return { success: false, message: "Only admins can delete subject offerings" };
    }

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("student_subject_enrollments")
      .select("id")
      .eq("school_id", context.schoolId)
      .eq("subject_offering_id", offeringId)
      .limit(1);

    if (enrollmentError) {
      return { success: false, message: enrollmentError.message || "Failed to validate offering usage" };
    }

    if (enrollments && enrollments.length > 0) {
      return { success: false, message: "Cannot delete subject offering with student enrollments" };
    }

    const { error: deleteError } = await supabase
      .from("subject_offerings")
      .delete()
      .eq("school_id", context.schoolId)
      .eq("id", offeringId);

    if (deleteError) {
      return { success: false, message: deleteError.message || "Failed to delete subject offering" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Subject offering deleted" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while deleting subject offering",
    };
  }
}

export async function getOfferedClassSectionIdsForSubject(
  subjectIdInput: number,
): Promise<{ classSectionIds: number[]; message?: string; success: boolean }> {
  try {
    if (!Number.isFinite(subjectIdInput) || subjectIdInput <= 0) {
      return { success: false, message: "Invalid subject", classSectionIds: [] };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school", classSectionIds: [] };
    }

    const activeYearResponse = await supabase
      .from("academic_years")
      .select("id")
      .eq("school_id", context.schoolId)
      .eq("is_active", true)
      .maybeSingle();

    if (activeYearResponse.error || !activeYearResponse.data) {
      return { success: false, message: "Set an active academic year first", classSectionIds: [] };
    }

    const { data: activeSections, error: activeSectionsError } = await supabase
      .from("class_sections")
      .select("id")
      .eq("school_id", context.schoolId)
      .eq("academic_year_id", activeYearResponse.data.id);

    if (activeSectionsError) {
      return {
        success: false,
        message: activeSectionsError.message || "Failed to load active class sections",
        classSectionIds: [],
      };
    }

    const activeSectionIds = (activeSections || []).map((row) => row.id);

    if (activeSectionIds.length === 0) {
      return { success: true, classSectionIds: [] };
    }

    const { data: existingOfferings, error: existingError } = await supabase
      .from("subject_offerings")
      .select("class_section_id")
      .eq("school_id", context.schoolId)
      .eq("subject_id", subjectIdInput)
      .in("class_section_id", activeSectionIds);

    if (existingError) {
      return {
        success: false,
        message: existingError.message || "Failed to validate existing offerings",
        classSectionIds: [],
      };
    }

    const classSectionIds = Array.from(new Set((existingOfferings || []).map((row) => row.class_section_id)));
    return { success: true, classSectionIds };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while loading offered class sections",
      classSectionIds: [],
    };
  }
}
