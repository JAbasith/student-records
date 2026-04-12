"use server";

import type { UserRole } from "@/features/access-control/access-control.types";
import { createClient } from "@/lib/supabase/server";

type BulkAllowlistRow = {
  rowNumber: number;
  email: string;
  fullName: string;
  role: UserRole;
  admissionNo: string | null;
  employeeNo: string | null;
};

type BulkAllowlistError = {
  row: number;
  message: string;
};

export type AddBulkToAllowlistInput = {
  csvContent: string;
  validateOnly?: boolean;
};

export type AddBulkToAllowlistResult = {
  success: boolean;
  insertedCount: number;
  totalRows: number;
  error?: string;
  errors?: BulkAllowlistError[];
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : "";

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

const allowedHeaders = new Set([
  "full_name",
  "name",
  "email",
  "role",
  "identity_number",
]);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function parseAndValidateRows(csvContent: string): { rows: BulkAllowlistRow[]; errors: BulkAllowlistError[] } {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 1, message: "CSV must include a header row and at least one data row" }],
    };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const unsupportedHeaders = headers.filter((header) => !allowedHeaders.has(header));
  const fullNameIndex = headers.findIndex((header) => header === "full_name" || header === "name");
  const emailIndex = headers.findIndex((header) => header === "email");
  const roleIndex = headers.findIndex((header) => header === "role");
  const identityIndex = headers.findIndex((header) => header === "identity_number");

  const errors: BulkAllowlistError[] = [];

  if (fullNameIndex < 0 || emailIndex < 0 || roleIndex < 0) {
    errors.push({
      row: 1,
      message: "CSV must include full_name (or name), email, and role columns",
    });
    return { rows: [], errors };
  }

  if (identityIndex < 0) {
    errors.push({
      row: 1,
      message: "CSV must include identity_number column",
    });
    return { rows: [], errors };
  }

  if (unsupportedHeaders.length > 0) {
    errors.push({
      row: 1,
      message: `CSV contains unsupported columns: ${unsupportedHeaders.join(", ")}`,
    });
    return { rows: [], errors };
  }

  const rows: BulkAllowlistRow[] = [];
  const seenEmails = new Map<string, number>();
  const seenAdmission = new Map<string, number>();
  const seenEmployee = new Map<string, number>();

  for (let index = 1; index < lines.length; index += 1) {
    const rowNumber = index + 1;
    const columns = parseCsvLine(lines[index]);

    if (columns.length > headers.length) {
      errors.push({ row: rowNumber, message: "CSV row contains extra columns" });
      continue;
    }

    const fullName = (columns[fullNameIndex] || "").trim();
    const email = normalizeEmail(columns[emailIndex] || "");
    const roleValue = (columns[roleIndex] || "").trim().toLowerCase();
    const identityNumber = (columns[identityIndex] || "").trim();
    const normalizedEmail = email;

    if (!fullName) {
      errors.push({ row: rowNumber, message: "full_name is required" });
    }

    if (!email) {
      errors.push({ row: rowNumber, message: "email is required" });
    } else if (!emailPattern.test(email)) {
      errors.push({ row: rowNumber, message: "email must be a valid email address" });
    }

    if (roleValue !== "student" && roleValue !== "teacher" && roleValue !== "admin") {
      errors.push({ row: rowNumber, message: "role must be admin, teacher, or student" });
      continue;
    }

    const role = roleValue as UserRole;

    let admissionNo: string | null = null;
    let employeeNo: string | null = null;

    if (role === "student") {
      admissionNo = identityNumber;
      if (!admissionNo) {
        errors.push({ row: rowNumber, message: "student row requires identity_number" });
      } else if (!/^ADM-/i.test(admissionNo)) {
        errors.push({ row: rowNumber, message: "student admission number must start with ADM-" });
      }
    }

    if (role === "teacher") {
      employeeNo = identityNumber;
      if (!employeeNo) {
        errors.push({ row: rowNumber, message: "teacher row requires identity_number" });
      } else if (!/^EMP-/i.test(employeeNo)) {
        errors.push({ row: rowNumber, message: "teacher employee number must start with EMP-" });
      }
    }

    if (role === "admin") {
      if (identityNumber) {
        errors.push({ row: rowNumber, message: "admin row must not include identity_number" });
      }
    }

    if (normalizedEmail) {
      const firstSeenRow = seenEmails.get(normalizedEmail);
      if (firstSeenRow) {
        errors.push({
          row: rowNumber,
          message: `email duplicates row ${firstSeenRow}`,
        });
      } else {
        seenEmails.set(normalizedEmail, rowNumber);
      }
    }

    if (admissionNo) {
      const key = admissionNo.toLowerCase();
      const firstSeenRow = seenAdmission.get(key);
      if (firstSeenRow) {
        errors.push({
          row: rowNumber,
          message: `admission_no duplicates row ${firstSeenRow}`,
        });
      } else {
        seenAdmission.set(key, rowNumber);
      }
    }

    if (employeeNo) {
      const key = employeeNo.toLowerCase();
      const firstSeenRow = seenEmployee.get(key);
      if (firstSeenRow) {
        errors.push({
          row: rowNumber,
          message: `employee_no duplicates row ${firstSeenRow}`,
        });
      } else {
        seenEmployee.set(key, rowNumber);
      }
    }

    rows.push({
      rowNumber,
      email: normalizedEmail,
      fullName,
      role,
      admissionNo,
      employeeNo,
    });
  }

  return { rows, errors };
}

async function validateIdentityUniqueness(
  row: BulkAllowlistRow,
  schoolId: number,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<BulkAllowlistError | null> {
  if (row.admissionNo) {
    const { data: existingAdmission, error: admissionLookupError } = await supabase
      .from("login_allowlist")
      .select("id")
      .eq("school_id", schoolId)
      .eq("admission_no", row.admissionNo)
      .maybeSingle();

    if (admissionLookupError) {
      return { row: row.rowNumber, message: admissionLookupError.message || "Failed to validate admission number" };
    }

    if (existingAdmission) {
      return { row: row.rowNumber, message: "This admission number is already on the allowlist" };
    }
  }

  if (row.employeeNo) {
    const { data: existingEmployee, error: employeeLookupError } = await supabase
      .from("login_allowlist")
      .select("id")
      .eq("school_id", schoolId)
      .eq("employee_no", row.employeeNo)
      .maybeSingle();

    if (employeeLookupError) {
      return { row: row.rowNumber, message: employeeLookupError.message || "Failed to validate employee number" };
    }

    if (existingEmployee) {
      return { row: row.rowNumber, message: "This employee number is already on the allowlist" };
    }
  }

  return null;
}

async function loadExistingAllowlistEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  emails: string[],
): Promise<{ existingEmails: Set<string>; error: string | null }> {
  if (emails.length === 0) {
    return { existingEmails: new Set<string>(), error: null };
  }

  const { data, error } = await supabase
    .from("login_allowlist")
    .select("email")
    .in("email", emails);

  if (error) {
    return {
      existingEmails: new Set<string>(),
      error: error.message || "Failed to validate email uniqueness",
    };
  }

  return {
    existingEmails: new Set((data || []).map((row: { email: string }) => row.email.toLowerCase())),
    error: null,
  };
}

function toDuplicateErrorMessage(message: string): string {
  if (message.includes("admission_no")) {
    return "This admission number is already on the allowlist";
  }

  if (message.includes("employee_no")) {
    return "This employee number is already on the allowlist";
  }

  return "This email is already on the allowlist";
}

export async function addBulkToAllowlist(input: AddBulkToAllowlistInput): Promise<AddBulkToAllowlistResult> {
  try {
    const csvContent = input.csvContent.trim();
    if (!csvContent) {
      return {
        success: false,
        insertedCount: 0,
        totalRows: 0,
        error: "CSV file is empty",
      };
    }

    const { rows, errors } = parseAndValidateRows(csvContent);
    if (errors.length > 0) {
      return {
        success: false,
        insertedCount: 0,
        totalRows: rows.length,
        error: "CSV validation failed",
        errors,
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        insertedCount: 0,
        totalRows: rows.length,
        error: "Unable to identify current user",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        insertedCount: 0,
        totalRows: rows.length,
        error: "Unable to determine school",
      };
    }

    const schoolId = profile.school_id;
    const { existingEmails, error: existingEmailsError } = await loadExistingAllowlistEmails(
      supabase,
      Array.from(new Set(rows.map((row) => row.email))),
    );

    if (existingEmailsError) {
      return {
        success: false,
        insertedCount: 0,
        totalRows: rows.length,
        error: existingEmailsError,
      };
    }

    const uniquenessErrors: BulkAllowlistError[] = [];
    for (const row of rows) {
      const uniquenessError = await validateIdentityUniqueness(row, schoolId, supabase);
      if (uniquenessError) {
        uniquenessErrors.push(uniquenessError);
        continue;
      }

      if (existingEmails.has(row.email)) {
        uniquenessErrors.push({
          row: row.rowNumber,
          message: "This email is already on the allowlist",
        });
      }
    }

    if (uniquenessErrors.length > 0) {
      return {
        success: false,
        insertedCount: 0,
        totalRows: rows.length,
        error: "CSV validation failed",
        errors: uniquenessErrors,
      };
    }

    if (input.validateOnly) {
      return {
        success: true,
        insertedCount: 0,
        totalRows: rows.length,
      };
    }

    const payload = rows.map((row) => ({
      email: row.email,
      school_id: schoolId,
      role: row.role,
      full_name: row.fullName,
      admission_no: row.admissionNo,
      employee_no: row.employeeNo,
      is_active: true,
    }));

    const { error: insertError } = await supabase.from("login_allowlist").insert(payload);

    if (insertError) {
      return {
        success: false,
        insertedCount: 0,
        totalRows: rows.length,
        error: insertError.code === "23505"
          ? toDuplicateErrorMessage(insertError.message)
          : insertError.message || "Failed to add user to allowlist",
      };
    }

    return {
      success: true,
      insertedCount: rows.length,
      totalRows: rows.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return {
      success: false,
      insertedCount: 0,
      totalRows: 0,
      error: message,
    };
  }
}
