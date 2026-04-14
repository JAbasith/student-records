"use server";

import type { ActionResult } from "@/features/academic-setup/shared/types";

export async function assignTeacherToOffering(formData: FormData): Promise<ActionResult> {
  const teacherId = formData.get("teacherId");
  const offeringId = formData.get("offeringId");

  // Stub: Backend disabled for non-academic-year operations
  return {
    success: false,
    message: `Teacher assignment is disabled for this academic year. Teacher: ${teacherId}, Offering: ${offeringId}`,
  };
}
