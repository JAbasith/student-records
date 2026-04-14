"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function updateManagedUser(input: {
  userId: string;
  fullName: string;
  isActive: boolean;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: input.fullName.trim(),
        is_active: input.isActive,
      })
      .eq("id", input.userId);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to update user",
      };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error while updating user",
    };
  }
}

export async function deleteManagedUser(input: {
  userId: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", input.userId);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to delete user",
      };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error while deleting user",
    };
  }
}
