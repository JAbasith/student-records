"use server";

import type { ActionResult } from "@/features/academic-setup/shared/types";

export async function enrollStudentToOffering(formData: FormData): Promise<ActionResult> {
  const studentId = formData.get("studentId");
  const offeringId = formData.get("offeringId");

  // Stub: Backend disabled for non-academic-year operations
  return {
    success: false,
    message: `Student enrollment is disabled for this academic year. Student: ${studentId}, Offering: ${offeringId}`,
  };
}

export async function bulkEnrollSectionForOffering(formData: FormData): Promise<ActionResult> {
  const offeringId = formData.get("offeringId");

  // Stub: Backend disabled for non-academic-year operations
  return {
    success: false,
    message: `Bulk enrollment is disabled for this academic year. Offering: ${offeringId}`,
  };
}
