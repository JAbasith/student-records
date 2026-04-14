import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePathMock,
}));

import { getOfferedClassSectionIdsForSubject } from "./index";

type MockConfig = {
  activeSectionsData?: Array<{ id: number }>;
  activeSectionsError?: { message: string } | null;
  activeYearData?: { id: number } | null;
  activeYearError?: { message: string } | null;
  existingOfferingsData?: Array<{ class_section_id: number }>;
  existingOfferingsError?: { message: string } | null;
  profileData?: { role: "admin" | "teacher" | "student"; school_id: number } | null;
  profileError?: { message: string } | null;
  userId?: string | null;
};

function createSupabaseClient(config: MockConfig = {}) {
  const getUser = vi.fn().mockResolvedValue({
    data: { user: config.userId === undefined ? { id: "user-1" } : config.userId ? { id: config.userId } : null },
    error: null,
  });

  const profileMaybeSingle = vi.fn().mockResolvedValue({
    data: config.profileData === undefined ? { school_id: 10, role: "admin" } : config.profileData,
    error: config.profileError ?? null,
  });
  const profileEq = vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
  const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });

  const yearMaybeSingle = vi.fn().mockResolvedValue({
    data: config.activeYearData === undefined ? { id: 2026 } : config.activeYearData,
    error: config.activeYearError ?? null,
  });
  const yearEq = vi.fn(() => ({ eq: yearEq, maybeSingle: yearMaybeSingle }));
  const yearSelect = vi.fn().mockReturnValue({ eq: yearEq });

  const activeSectionsEqSecond = vi.fn().mockReturnValue({
    data: config.activeSectionsData ?? [{ id: 1 }, { id: 2 }, { id: 3 }],
    error: config.activeSectionsError ?? null,
  });
  const activeSectionsEqFirst = vi.fn().mockReturnValue({ eq: activeSectionsEqSecond });
  const activeSectionsSelect = vi.fn().mockReturnValue({ eq: activeSectionsEqFirst });

  const offeringsIn = vi.fn().mockResolvedValue({
    data: config.existingOfferingsData ?? [{ class_section_id: 2 }, { class_section_id: 3 }, { class_section_id: 3 }],
    error: config.existingOfferingsError ?? null,
  });
  const offeringsEq = vi.fn(() => ({ eq: offeringsEq, in: offeringsIn }));
  const offeringsSelect = vi.fn().mockReturnValue({ eq: offeringsEq });

  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return { select: profileSelect };
    }
    if (table === "academic_years") {
      return { select: yearSelect };
    }
    if (table === "class_sections") {
      return { select: activeSectionsSelect };
    }
    if (table === "subject_offerings") {
      return { select: offeringsSelect };
    }
    return undefined;
  });

  return {
    client: {
      auth: { getUser },
      from,
    },
    spies: {
      activeSectionsEqFirst,
      activeSectionsEqSecond,
      activeSectionsSelect,
      from,
      getUser,
      offeringsEq,
      offeringsIn,
      offeringsSelect,
      profileEq,
      profileMaybeSingle,
      profileSelect,
      yearEq,
      yearMaybeSingle,
      yearSelect,
    },
  };
}

describe("getOfferedClassSectionIdsForSubject", () => {
  it("returns validation error for invalid subject id", async () => {
    await expect(getOfferedClassSectionIdsForSubject(0)).resolves.toEqual({
      classSectionIds: [],
      message: "Invalid subject",
      success: false,
    });
  });

  it("returns error when user context cannot be determined", async () => {
    const { client } = createSupabaseClient({ userId: null });
    mocks.createClientMock.mockResolvedValue(client);

    await expect(getOfferedClassSectionIdsForSubject(12)).resolves.toEqual({
      classSectionIds: [],
      message: "Unable to determine your school",
      success: false,
    });
  });

  it("returns error when active academic year is not available", async () => {
    const { client } = createSupabaseClient({ activeYearData: null });
    mocks.createClientMock.mockResolvedValue(client);

    await expect(getOfferedClassSectionIdsForSubject(12)).resolves.toEqual({
      classSectionIds: [],
      message: "Set an active academic year first",
      success: false,
    });
  });

  it("returns unique offered class section ids for the selected subject", async () => {
    const { client, spies } = createSupabaseClient();
    mocks.createClientMock.mockResolvedValue(client);

    const result = await getOfferedClassSectionIdsForSubject(12);

    expect(result).toEqual({
      classSectionIds: [2, 3],
      success: true,
    });

    expect(spies.offeringsIn).toHaveBeenCalledWith("class_section_id", [1, 2, 3]);
    expect(spies.offeringsEq).toHaveBeenCalledWith("subject_id", 12);
  });

  it("returns error when offerings lookup fails", async () => {
    const { client } = createSupabaseClient({
      existingOfferingsError: { message: "subject_offerings failed" },
    });
    mocks.createClientMock.mockResolvedValue(client);

    await expect(getOfferedClassSectionIdsForSubject(12)).resolves.toEqual({
      classSectionIds: [],
      message: "subject_offerings failed",
      success: false,
    });
  });
});
