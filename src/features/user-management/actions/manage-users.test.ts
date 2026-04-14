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

import { deleteManagedUser, updateManagedUser } from "./manage-users";

function createSupabaseClient() {
  const eq = vi.fn();
  const update = vi.fn().mockReturnValue({ eq });
  const del = vi.fn().mockReturnValue({ eq });
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        update,
        delete: del,
      };
    }

    return undefined;
  });

  return {
    client: { from },
    spies: { update, del, eq, from },
  };
}

describe("updateManagedUser", () => {
  it("updates profile and revalidates paths", async () => {
    const { client, spies } = createSupabaseClient();
    spies.eq.mockResolvedValue({ error: null });
    mocks.createClientMock.mockResolvedValue(client);

    await expect(
      updateManagedUser({
        userId: "user-1",
        fullName: "Updated User",
        isActive: true,
      }),
    ).resolves.toEqual({ success: true });

    expect(spies.update).toHaveBeenCalledWith({
      full_name: "Updated User",
      is_active: true,
    });
    expect(spies.eq).toHaveBeenCalledWith("id", "user-1");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/admin/users");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/admin");
  });

  it("returns error when update fails", async () => {
    const { client, spies } = createSupabaseClient();
    spies.eq.mockResolvedValue({ error: { message: "update failed" } });
    mocks.createClientMock.mockResolvedValue(client);

    await expect(
      updateManagedUser({
        userId: "user-1",
        fullName: "Updated User",
        isActive: false,
      }),
    ).resolves.toEqual({ success: false, error: "update failed" });
  });
});

describe("deleteManagedUser", () => {
  it("deletes profile and revalidates paths", async () => {
    const { client, spies } = createSupabaseClient();
    spies.eq.mockResolvedValue({ error: null });
    mocks.createClientMock.mockResolvedValue(client);

    await expect(deleteManagedUser({ userId: "user-1" })).resolves.toEqual({ success: true });

    expect(spies.del).toHaveBeenCalledTimes(1);
    expect(spies.eq).toHaveBeenCalledWith("id", "user-1");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/admin/users");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/admin");
  });

  it("returns error when delete fails", async () => {
    const { client, spies } = createSupabaseClient();
    spies.eq.mockResolvedValue({ error: { message: "delete failed" } });
    mocks.createClientMock.mockResolvedValue(client);

    await expect(deleteManagedUser({ userId: "user-1" })).resolves.toEqual({
      success: false,
      error: "delete failed",
    });
  });
});
