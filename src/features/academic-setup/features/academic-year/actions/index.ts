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

async function getCurrentSchoolId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return (profile as { school_id: number }).school_id;
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

async function setActiveAcademicYear(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: number,
  academicYearId: number,
): Promise<{ error?: Error | null }> {
  const { error: deactivateError } = await supabase
    .from("academic_years")
    .update({ is_active: false })
    .eq("school_id", schoolId);

  if (deactivateError) {
    return { error: deactivateError };
  }

  const { error: activateError } = await supabase
    .from("academic_years")
    .update({ is_active: true })
    .eq("school_id", schoolId)
    .eq("id", academicYearId);

  return { error: activateError };
}

export async function setActiveAcademicYearAction(formData: FormData): Promise<ActionResult> {
  try {
    const academicYearId = toInteger(getStringValue(formData.get("academicYearId")));

    if (!academicYearId) {
      return { success: false, message: "Select an academic year" };
    }

    const supabase = await createClient();
    const schoolId = await getCurrentSchoolId(supabase);

    if (!schoolId) {
      return { success: false, message: "Unable to determine your school" };
    }

    const { error } = await setActiveAcademicYear(supabase, schoolId, academicYearId);

    if (error) {
      return { success: false, message: error.message || "Failed to update active academic year" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Academic year updated" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while updating academic year",
    };
  }
}

export async function createAcademicYearAndActivate(formData: FormData): Promise<ActionResult> {
  try {
    const name = getStringValue(formData.get("name"));
    const startDate = getStringValue(formData.get("startDate"));
    const endDate = getStringValue(formData.get("endDate"));

    if (!name || !startDate || !endDate) {
      return { success: false, message: "Academic year name, start date, and end date are required" };
    }

    const supabase = await createClient();
    const schoolId = await getCurrentSchoolId(supabase);

    if (!schoolId) {
      return { success: false, message: "Unable to determine your school" };
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from("academic_years")
      .insert({
        end_date: endDate,
        is_active: false,
        name,
        school_id: schoolId,
        start_date: startDate,
      })
      .select("id")
      .maybeSingle();

    if (insertError || !insertedRow) {
      return { success: false, message: insertError?.message || "Failed to create academic year" };
    }

    const { error } = await setActiveAcademicYear(supabase, schoolId, insertedRow.id);

    if (error) {
      return { success: false, message: error.message || "Failed to activate new academic year" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Academic year created and activated" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while creating academic year",
    };
  }
}

export async function deleteAcademicYearAction(formData: FormData): Promise<ActionResult> {
  try {
    const academicYearId = toInteger(getStringValue(formData.get("academicYearId")));

    if (!academicYearId) {
      return { success: false, message: "Select an academic year" };
    }

    const supabase = await createClient();
    const context = await getCurrentSchoolContext(supabase);

    if (!context) {
      return { success: false, message: "Unable to determine your school" };
    }

    if (context.role !== "admin") {
      return { success: false, message: "Only admins can delete academic years" };
    }

    const { data: yearRow, error: yearError } = await supabase
      .from("academic_years")
      .select("id, is_active")
      .eq("school_id", context.schoolId)
      .eq("id", academicYearId)
      .maybeSingle();

    if (yearError || !yearRow) {
      return { success: false, message: "Academic year was not found" };
    }

    if (yearRow.is_active) {
      return { success: false, message: "Cannot delete the active academic year. Set another year active first." };
    }

    const { error: deleteError } = await supabase
      .from("academic_years")
      .delete()
      .eq("school_id", context.schoolId)
      .eq("id", academicYearId);

    if (deleteError) {
      return { success: false, message: deleteError.message || "Failed to delete academic year" };
    }

    revalidateAcademicViews();
    return { success: true, message: "Academic year deleted" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error while deleting academic year",
    };
  }
}
