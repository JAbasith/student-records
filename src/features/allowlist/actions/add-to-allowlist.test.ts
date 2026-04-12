import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClientMock,
}));

import { addToAllowlist } from "./add-to-allowlist";

function createSupabaseClient() {
  const getUser = vi.fn();
  const single = vi.fn();
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const insert = vi.fn();
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return { select };
    }

    if (table === "login_allowlist") {
      return { insert };
    }

    return undefined;
  });

  return {
    client: {
      auth: { getUser },
      from,
    },
    spies: { getUser, single, eq, select, insert, from },
  };
}

describe("addToAllowlist", () => {
  it("returns an error when the current user cannot be identified", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(
      addToAllowlist({
        email: "student@school.edu",
        fullName: "Student User",
        role: "student",
        identityNumber: "ADM-1001",
      }),
    ).resolves.toEqual({ success: false, error: "Unable to identify current user" });

    expect(spies.from).not.toHaveBeenCalledWith("login_allowlist");
  });

  it("returns an error when the school cannot be determined", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    spies.single.mockResolvedValue({ data: null, error: new Error("missing profile") });

    await expect(
      addToAllowlist({
        email: "teacher@school.edu",
        fullName: "Teacher User",
        role: "teacher",
        identityNumber: "EMP-2001",
      }),
    ).resolves.toEqual({ success: false, error: "Unable to determine school" });

    expect(spies.insert).not.toHaveBeenCalled();
  });

  it("adds a student with an admission number and no employee number", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.single.mockResolvedValue({ data: { school_id: 42 }, error: null });
    spies.insert.mockResolvedValue({ error: null });

    await expect(
      addToAllowlist({
        email: "student@school.edu",
        fullName: "Student User",
        role: "student",
        identityNumber: "ADM-1001",
      }),
    ).resolves.toEqual({ success: true });

    expect(spies.insert).toHaveBeenCalledWith({
      email: "student@school.edu",
      school_id: 42,
      role: "student",
      full_name: "Student User",
      admission_no: "ADM-1001",
      employee_no: null,
      is_active: true,
    });
  });

  it("adds a teacher with an employee number and no admission number", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.single.mockResolvedValue({ data: { school_id: 42 }, error: null });
    spies.insert.mockResolvedValue({ error: null });

    await expect(
      addToAllowlist({
        email: "teacher@school.edu",
        fullName: "Teacher User",
        role: "teacher",
        identityNumber: "EMP-2001",
      }),
    ).resolves.toEqual({ success: true });

    expect(spies.insert).toHaveBeenCalledWith({
      email: "teacher@school.edu",
      school_id: 42,
      role: "teacher",
      full_name: "Teacher User",
      admission_no: null,
      employee_no: "EMP-2001",
      is_active: true,
    });
  });

  it("adds an admin without a domain identity number", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.single.mockResolvedValue({ data: { school_id: 42 }, error: null });
    spies.insert.mockResolvedValue({ error: null });

    await expect(
      addToAllowlist({
        email: "admin@school.edu",
        fullName: "Admin User",
        role: "admin",
        identityNumber: "ADM-9001",
      }),
    ).resolves.toEqual({ success: true });

    expect(spies.insert).toHaveBeenCalledWith({
      email: "admin@school.edu",
      school_id: 42,
      role: "admin",
      full_name: "Admin User",
      admission_no: null,
      employee_no: null,
      is_active: true,
    });
  });

  it("returns a friendly message for duplicate email entries", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);
    spies.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
    spies.single.mockResolvedValue({ data: { school_id: 42 }, error: null });
    spies.insert.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });

    await expect(
      addToAllowlist({
        email: "student@school.edu",
        fullName: "Student User",
        role: "student",
        identityNumber: "ADM-1001",
      }),
    ).resolves.toEqual({ success: false, error: "This email is already on the allowlist" });
  });
});