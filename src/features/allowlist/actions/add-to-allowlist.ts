"use server";

import type { UserRole } from "@/features/access-control/access-control.types";
import { createClient } from "@/lib/supabase/server";

export type AddToAllowlistInput = {
  email: string;
  fullName: string;
  role: UserRole;
  identityNumber: string;
};

type AddToAllowlistResult = {
  success: boolean;
  error?: string;
};

export async function addToAllowlist(input: AddToAllowlistInput): Promise<AddToAllowlistResult> {
  try {
    const supabase = await createClient();

    // Get current user's profile to determine schoolId
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Unable to identify current user",
      };
    }

    // Get the user's profile to access schoolId
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Unable to determine school",
      };
    }

    const schoolId = profile.school_id;

    // Prepare values based on role
    let admissionNo: string | null = null;
    let employeeNo: string | null = null;

    if (input.role === "student") {
      admissionNo = input.identityNumber;
    } else if (input.role === "teacher") {
      employeeNo = input.identityNumber;
    }

    if (admissionNo) {
      const { data: existingAdmission, error: admissionLookupError } = await supabase
        .from("login_allowlist")
        .select("id")
        .eq("school_id", schoolId)
        .eq("admission_no", admissionNo)
        .maybeSingle();

      if (admissionLookupError) {
        return {
          success: false,
          error: admissionLookupError.message || "Failed to validate admission number",
        };
      }

      if (existingAdmission) {
        return {
          success: false,
          error: "This admission number is already on the allowlist",
        };
      }
    }

    if (employeeNo) {
      const { data: existingEmployee, error: employeeLookupError } = await supabase
        .from("login_allowlist")
        .select("id")
        .eq("school_id", schoolId)
        .eq("employee_no", employeeNo)
        .maybeSingle();

      if (employeeLookupError) {
        return {
          success: false,
          error: employeeLookupError.message || "Failed to validate employee number",
        };
      }

      if (existingEmployee) {
        return {
          success: false,
          error: "This employee number is already on the allowlist",
        };
      }
    }

    // Insert into login_allowlist
    const { error: insertError } = await supabase.from("login_allowlist").insert({
      email: input.email,
      school_id: schoolId,
      role: input.role,
      full_name: input.fullName,
      admission_no: admissionNo,
      employee_no: employeeNo,
      is_active: true,
    });

    if (insertError) {
      // Handle duplicate constraints from DB level validation
      if (insertError.code === "23505") {
        if (insertError.message.includes("admission_no")) {
          return {
            success: false,
            error: "This admission number is already on the allowlist",
          };
        }
        if (insertError.message.includes("employee_no")) {
          return {
            success: false,
            error: "This employee number is already on the allowlist",
          };
        }
        return {
          success: false,
          error: "This email is already on the allowlist",
        };
      }
      return {
        success: false,
        error: insertError.message || "Failed to add user to allowlist",
      };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return {
      success: false,
      error: message,
    };
  }
}
