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

function revalidateAcademicViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/academic");
  revalidatePath("/subjects");
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

export async function createGradeLevelAction(formData: FormData): Promise<ActionResult> {
  try {
    const name = getStringValue(formData.get("name"));
    const category = getStringValue(formData.get("category"));
    const sortOrderValue = getStringValue(formData.get("sortOrder"));
    const sortOrder = sortOrderValue ? toInteger(sortOrderValue) : null;

    if (!name) {
      return { success: false, message: "Grade name is required" };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school" };
    }

    if (context.role !== "admin") {
      return { success: false, message: "Only admins can manage grade levels" };
    }

    const { data: existing, error: existingError } = await supabase
      .from("grade_levels")
      .select("id")
      .eq("school_id", context.schoolId)
      .ilike("name", name)
      .limit(1);

    if (existingError) {
      return { success: false, message: existingError.message || "Failed to validate grade level" };
    }

    if (existing && existing.length > 0) {
      return { success: false, message: "Grade level already exists" };
    }

    const { error: insertError } = await supabase.from("grade_levels").insert({
      category: category || null,
      name,
      school_id: context.schoolId,
      sort_order: sortOrder,
    });

    if (insertError) {
      return { success: false, message: insertError.message || "Failed to create grade level" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Grade level created" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while creating grade level",
    };
  }
}

export async function deleteGradeLevelAction(formData: FormData): Promise<ActionResult> {
  try {
    const gradeLevelId = toInteger(getStringValue(formData.get("gradeLevelId")));

    if (!gradeLevelId) {
      return { success: false, message: "Select a grade level" };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school" };
    }

    if (context.role !== "admin") {
      return { success: false, message: "Only admins can delete grade levels" };
    }

    const { data: sections, error: sectionError } = await supabase
      .from("class_sections")
      .select("id")
      .eq("school_id", context.schoolId)
      .eq("grade_level_id", gradeLevelId)
      .limit(1);

    if (sectionError) {
      return { success: false, message: sectionError.message || "Failed to validate grade level usage" };
    }

    if (sections && sections.length > 0) {
      return { success: false, message: "Cannot delete grade level with existing class sections" };
    }

    const { error: deleteError } = await supabase
      .from("grade_levels")
      .delete()
      .eq("school_id", context.schoolId)
      .eq("id", gradeLevelId);

    if (deleteError) {
      return { success: false, message: deleteError.message || "Failed to delete grade level" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Grade level deleted" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while deleting grade level",
    };
  }
}

export async function createClassSectionAction(formData: FormData): Promise<ActionResult> {
  try {
    const gradeLevelId = toInteger(getStringValue(formData.get("gradeLevelId")));
    const name = getStringValue(formData.get("name"));

    if (!gradeLevelId) {
      return { success: false, message: "Select a grade level" };
    }

    if (!name) {
      return { success: false, message: "Class section name is required" };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school" };
    }

    if (context.role !== "admin") {
      return { success: false, message: "Only admins can manage class sections" };
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

    const { data: existing, error: existingError } = await supabase
      .from("class_sections")
      .select("id")
      .eq("school_id", context.schoolId)
      .eq("academic_year_id", activeYearResponse.data.id)
      .eq("grade_level_id", gradeLevelId)
      .ilike("name", name)
      .limit(1);

    if (existingError) {
      return { success: false, message: existingError.message || "Failed to validate class section" };
    }

    if (existing && existing.length > 0) {
      return { success: false, message: "Class section already exists for the selected grade" };
    }

    const { error: insertError } = await supabase.from("class_sections").insert({
      academic_year_id: activeYearResponse.data.id,
      grade_level_id: gradeLevelId,
      name,
      school_id: context.schoolId,
    });

    if (insertError) {
      return { success: false, message: insertError.message || "Failed to create class section" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Class section created" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while creating class section",
    };
  }
}

export async function deleteClassSectionAction(formData: FormData): Promise<ActionResult> {
  try {
    const classSectionId = toInteger(getStringValue(formData.get("classSectionId")));

    if (!classSectionId) {
      return { success: false, message: "Select a class section" };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school" };
    }

    if (context.role !== "admin") {
      return { success: false, message: "Only admins can delete class sections" };
    }

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("student_enrollments")
      .select("id")
      .eq("school_id", context.schoolId)
      .eq("class_section_id", classSectionId)
      .limit(1);

    if (enrollmentError) {
      return { success: false, message: enrollmentError.message || "Failed to validate class section usage" };
    }

    if (enrollments && enrollments.length > 0) {
      return { success: false, message: "Cannot delete class section with student enrollments" };
    }

    const { error: deleteError } = await supabase
      .from("class_sections")
      .delete()
      .eq("school_id", context.schoolId)
      .eq("id", classSectionId);

    if (deleteError) {
      return { success: false, message: deleteError.message || "Failed to delete class section" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Class section deleted" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while deleting class section",
    };
  }
}
