import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClientMock,
}));

import { getAllowlistCsvTemplate } from "@/features/allowlist/constants/allowlist-csv-template";

import { addBulkToAllowlist } from "./add-bulk-to-allowlist";

function createSupabaseClient() {
  const getUser = vi.fn();

  const profileSingle = vi.fn();
  const profileEq = vi.fn().mockReturnValue({ single: profileSingle });
  const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });

  const allowlistMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const allowlistEq = vi.fn();
  allowlistEq.mockImplementation(() => ({
    eq: allowlistEq,
    maybeSingle: allowlistMaybeSingle,
  }));
  const allowlistIn = vi.fn().mockReturnValue({ data: [], error: null });
  const allowlistSelect = vi.fn((columns: string) => {
    if (columns === "email") {
      return { in: allowlistIn };
    }

    return { eq: allowlistEq };
  });

  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return { select: profileSelect };
    }

    if (table === "login_allowlist") {
      return { select: allowlistSelect, insert };
    }

    return undefined;
  });

  return {
    client: {
      auth: { getUser },
      from,
    },
    spies: {
      getUser,
      profileSingle,
      allowlistMaybeSingle,
      allowlistIn,
      insert,
      from,
    },
  };
}

describe("addBulkToAllowlist", () => {
  it("returns csv validation errors when required headers are missing", async () => {
    const result = await addBulkToAllowlist({
      csvContent: "email,role\nstudent@school.edu,student",
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("CSV validation failed");
    expect(result.errors?.[0]?.message).toContain("full_name");
  });

  it("rejects empty files with only headers", async () => {
    const result = await addBulkToAllowlist({
      csvContent: "full_name,email,role,identity_number",
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("CSV validation failed");
    expect(result.errors).toEqual([
      {
        row: 1,
        message: "CSV must include a header row and at least one data row",
      },
    ]);
  });

  it("returns csv validation errors when unsupported headers are present", async () => {
    const result = await addBulkToAllowlist({
      csvContent: "full_name,email,role,identity_number,phone\nStudent User,student@school.edu,student,ADM-1001,12345",
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("CSV validation failed");
    expect(result.errors).toEqual([
      {
        row: 1,
        message: "CSV contains unsupported columns: phone",
      },
    ]);
  });

  it("rejects missing required fields", async () => {
    const result = await addBulkToAllowlist({
      csvContent: "full_name,email,role,identity_number\n, , ,",
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("CSV validation failed");
    expect(result.errors?.some((error) => error.message === "full_name is required")).toBe(true);
    expect(result.errors?.some((error) => error.message === "email is required")).toBe(true);
    expect(result.errors?.some((error) => error.message === "role must be admin, teacher, or student")).toBe(true);
  });

  it("rejects invalid email formats", async () => {
    const result = await addBulkToAllowlist({
      csvContent: "full_name,email,role,identity_number\nStudent User,invalid-email,student,ADM-1001",
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      {
        row: 2,
        message: "email must be a valid email address",
      },
    ]);
  });

  it("rejects invalid roles", async () => {
    const result = await addBulkToAllowlist({
      csvContent: "full_name,email,role,identity_number\nStudent User,student@school.edu,principal,ADM-1001",
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      {
        row: 2,
        message: "role must be admin, teacher, or student",
      },
    ]);
  });

  it("rejects missing identity numbers for teacher and student rows", async () => {
    const result = await addBulkToAllowlist({
      csvContent: [
        "full_name,email,role,identity_number",
        "Student One,student1@school.edu,student,",
        "Teacher One,teacher1@school.edu,teacher,",
      ].join("\n"),
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      {
        row: 2,
        message: "student row requires identity_number",
      },
      {
        row: 3,
        message: "teacher row requires identity_number",
      },
    ]);
  });

  it("rejects role identity mismatches and admin identity violations", async () => {
    const result = await addBulkToAllowlist({
      csvContent: [
        "full_name,email,role,identity_number",
        "Student One,student1@school.edu,student,EMP-1001",
        "Teacher One,teacher1@school.edu,teacher,ADM-2001",
        "Admin One,admin1@school.edu,admin,ADM-3001",
      ].join("\n"),
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      {
        row: 2,
        message: "student admission number must start with ADM-",
      },
      {
        row: 3,
        message: "teacher employee number must start with EMP-",
      },
      {
        row: 4,
        message: "admin row must not include identity_number",
      },
    ]);
  });

  it("validates only without inserting rows", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.profileSingle.mockResolvedValue({ data: { school_id: 42 }, error: null });

    const csv = [
      "full_name,email,role,identity_number",
      "A. Perera,teacher@school.edu,teacher,EMP-1044",
      "N. Silva,student@school.edu,student,ADM-2201",
    ].join("\n");

    const result = await addBulkToAllowlist({ csvContent: csv, validateOnly: true });

    expect(result).toEqual({
      success: true,
      insertedCount: 0,
      totalRows: 2,
    });
    expect(spies.insert).not.toHaveBeenCalled();
  });

  it("uploads valid rows from csv with mixed casing and column order", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.profileSingle.mockResolvedValue({ data: { school_id: 42 }, error: null });

    const csv = [
      "role,email,identity_number,full_name",
      " TEACHER , Teacher@School.edu , EMP-1044 , A. Perera ",
      " STUDENT , Student@School.edu , ADM-2201 , N. Silva ",
    ].join("\n");

    const result = await addBulkToAllowlist({ csvContent: csv });

    expect(result).toEqual({
      success: true,
      insertedCount: 2,
      totalRows: 2,
    });

    expect(spies.insert).toHaveBeenCalledWith([
      {
        email: "teacher@school.edu",
        school_id: 42,
        role: "teacher",
        full_name: "A. Perera",
        admission_no: null,
        employee_no: "EMP-1044",
        is_active: true,
      },
      {
        email: "student@school.edu",
        school_id: 42,
        role: "student",
        full_name: "N. Silva",
        admission_no: "ADM-2201",
        employee_no: null,
        is_active: true,
      },
    ]);
  });

  it("rejects duplicate emails within the csv", async () => {
    const result = await addBulkToAllowlist({
      csvContent: [
        "full_name,email,role,identity_number",
        "Student One,duplicate@school.edu,student,ADM-1001",
        "Student Two,Duplicate@school.edu,student,ADM-1002",
      ].join("\n"),
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      {
        row: 3,
        message: "email duplicates row 2",
      },
    ]);
  });

  it("returns error when admission number already exists", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.profileSingle.mockResolvedValue({ data: { school_id: 42 }, error: null });
    spies.allowlistMaybeSingle.mockResolvedValueOnce({ data: { id: 7 }, error: null });

    const csv = [
      "full_name,email,role,identity_number",
      "N. Silva,student@school.edu,student,ADM-2201",
    ].join("\n");

    const result = await addBulkToAllowlist({ csvContent: csv });

    expect(result.success).toBe(false);
    expect(result.error).toBe("CSV validation failed");
    expect(result.errors).toEqual([
      {
        row: 2,
        message: "This admission number is already on the allowlist",
      },
    ]);
    expect(spies.insert).not.toHaveBeenCalled();
  });

  it("returns error when employee number already exists", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.profileSingle.mockResolvedValue({ data: { school_id: 42 }, error: null });
    spies.allowlistMaybeSingle.mockResolvedValueOnce({ data: { id: 8 }, error: null });

    const csv = [
      "full_name,email,role,identity_number",
      "A. Perera,teacher@school.edu,teacher,EMP-1044",
    ].join("\n");

    const result = await addBulkToAllowlist({ csvContent: csv });

    expect(result.success).toBe(false);
    expect(result.error).toBe("CSV validation failed");
    expect(result.errors).toEqual([
      {
        row: 2,
        message: "This employee number is already on the allowlist",
      },
    ]);
    expect(spies.insert).not.toHaveBeenCalled();
  });

  it("rejects duplicate emails already in the allowlist database", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.profileSingle.mockResolvedValue({ data: { school_id: 42 }, error: null });
    spies.allowlistIn.mockReturnValue({
      data: [{ email: "student@school.edu" }],
      error: null,
    });

    const csv = [
      "full_name,email,role,identity_number",
      "Student User,student@school.edu,student,ADM-2201",
    ].join("\n");

    const result = await addBulkToAllowlist({ csvContent: csv, validateOnly: true });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      {
        row: 2,
        message: "This email is already on the allowlist",
      },
    ]);
  });

  it("returns error when csv contains duplicate identity values", async () => {
    const csv = [
      "full_name,email,role,identity_number",
      "N. Silva,student1@school.edu,student,ADM-2201",
      "K. Fernando,student2@school.edu,student,ADM-2201",
    ].join("\n");

    const result = await addBulkToAllowlist({ csvContent: csv, validateOnly: true });

    expect(result.success).toBe(false);
    expect(result.error).toBe("CSV validation failed");
    expect(result.errors).toEqual([
      {
        row: 3,
        message: "admission_no duplicates row 2",
      },
    ]);
  });

  it("rejects mixed valid and invalid rows in strict mode", async () => {
    const result = await addBulkToAllowlist({
      csvContent: [
        "full_name,email,role,identity_number",
        "Student One,student1@school.edu,student,ADM-1001",
        "Student Two,invalid-email,student,ADM-1002",
      ].join("\n"),
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors?.some((error) => error.message === "email must be a valid email address")).toBe(true);
  });

  it("accepts special characters in names and strings that look malicious", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.profileSingle.mockResolvedValue({ data: { school_id: 42 }, error: null });

    const csv = [
      "full_name,email,role,identity_number",
      "José Álvarez; DROP TABLE users;,jose@example.com,student,ADM-5001",
    ].join("\n");

    const result = await addBulkToAllowlist({ csvContent: csv });

    expect(result.success).toBe(true);
    expect(spies.insert).toHaveBeenCalledWith([
      {
        email: "jose@example.com",
        school_id: 42,
        role: "student",
        full_name: "José Álvarez; DROP TABLE users;",
        admission_no: "ADM-5001",
        employee_no: null,
        is_active: true,
      },
    ]);
  });

  it("processes larger files without failing validation", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.profileSingle.mockResolvedValue({ data: { school_id: 42 }, error: null });

    const rows = ["full_name,email,role,identity_number"];
    for (let index = 1; index <= 250; index += 1) {
      rows.push(`Student ${index},student${index}@school.edu,student,ADM-${1000 + index}`);
    }

    const result = await addBulkToAllowlist({ csvContent: rows.join("\n"), validateOnly: true });

    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(250);
    expect(spies.insert).not.toHaveBeenCalled();
  });

  it("rejects csv row with extra values", async () => {
    const result = await addBulkToAllowlist({
      csvContent: "full_name,email,role,identity_number\nStudent User,student@school.edu,student,ADM-1001,extra-value",
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      {
        row: 2,
        message: "CSV row contains extra columns",
      },
    ]);
  });

  it("rejects incorrect header names", async () => {
    const result = await addBulkToAllowlist({
      csvContent: "fullname,email_address,role,id\nStudent User,student@school.edu,student,ADM-1001",
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.errors?.[0]?.message).toContain("full_name (or name), email, and role columns");
  });

  it("rolls back the full upload when insert fails", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.profileSingle.mockResolvedValue({ data: { school_id: 42 }, error: null });
    spies.insert.mockResolvedValue({
      error: { code: "23505", message: 'duplicate key value violates unique constraint "login_allowlist_email_key"' },
    });

    const csv = [
      "full_name,email,role,identity_number",
      "Student One,student1@school.edu,student,ADM-1001",
      "Student Two,student2@school.edu,student,ADM-1002",
    ].join("\n");

    const result = await addBulkToAllowlist({ csvContent: csv });

    expect(result.success).toBe(false);
    expect(result.error).toBe("This email is already on the allowlist");
    expect(result.insertedCount).toBe(0);
    expect(spies.insert).toHaveBeenCalledTimes(1);
  });

  it("returns csv validation errors when a row has extra values", async () => {
    const result = await addBulkToAllowlist({
      csvContent: "full_name,email,role,identity_number\nStudent User,student@school.edu,student,ADM-1001,extra-value",
      validateOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("CSV validation failed");
    expect(result.errors).toEqual([
      {
        row: 2,
        message: "CSV row contains extra columns",
      },
    ]);
  });
});

describe("getAllowlistCsvTemplate", () => {
  it("returns a template with expected columns", () => {
    const template = getAllowlistCsvTemplate();

    expect(template.split("\n")[0]).toBe("full_name,email,role,identity_number");
  });
});
