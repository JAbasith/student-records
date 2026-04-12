import { afterEach, describe, expect, it, vi } from "vitest";

import { ensureAllowlistedSession, getSessionUserRole } from "./session-authorization";

function createSupabaseClient() {
  const exchangeCodeForSession = vi.fn();
  const getUser = vi.fn();
  const signOut = vi.fn().mockResolvedValue(undefined);
  const rpc = vi.fn();
  const maybeSingle = vi.fn();
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return {
    client: {
      auth: { exchangeCodeForSession, getUser, signOut },
      rpc,
      from,
    },
    spies: { exchangeCodeForSession, getUser, signOut, rpc, from, select, eq, maybeSingle },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ensureAllowlistedSession", () => {
  it("returns oauth-exchange-failed when code exchange fails", async () => {
    const { client, spies } = createSupabaseClient();
    spies.exchangeCodeForSession.mockResolvedValue({ error: new Error("exchange failed") });

    await expect(ensureAllowlistedSession(client, "abc")).resolves.toBe("oauth-exchange-failed");
    expect(spies.getUser).not.toHaveBeenCalled();
    expect(spies.rpc).not.toHaveBeenCalled();
    expect(spies.signOut).not.toHaveBeenCalled();
  });

  it("signs out and returns session-user-missing when user data is incomplete", async () => {
    const { client, spies } = createSupabaseClient();
    spies.exchangeCodeForSession.mockResolvedValue({ error: null });
    spies.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(ensureAllowlistedSession(client, "abc")).resolves.toBe("session-user-missing");
    expect(spies.signOut).toHaveBeenCalledTimes(1);
    expect(spies.rpc).not.toHaveBeenCalled();
  });

  it("trims the full name before calling the allowlist RPC", async () => {
    const { client, spies } = createSupabaseClient();
    spies.exchangeCodeForSession.mockResolvedValue({ error: null });
    spies.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "teacher@school.edu",
          user_metadata: { full_name: "  Ada Lovelace  " },
        },
      },
      error: null,
    });
    spies.rpc.mockResolvedValue({ data: false, error: null });

    await expect(ensureAllowlistedSession(client, "abc")).resolves.toBe("not-approved");
    expect(spies.rpc).toHaveBeenCalledWith("upsert_profile_from_allowlist", {
      p_user_id: "user-1",
      p_email: "teacher@school.edu",
      p_full_name: "Ada Lovelace",
    });
    expect(spies.signOut).toHaveBeenCalledTimes(1);
  });

  it("returns null when the allowlist RPC approves the user", async () => {
    const { client, spies } = createSupabaseClient();
    spies.exchangeCodeForSession.mockResolvedValue({ error: null });
    spies.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-2",
          email: "student@school.edu",
          user_metadata: { name: "Grace Hopper" },
        },
      },
      error: null,
    });
    spies.rpc.mockResolvedValue({ data: true, error: null });

    await expect(ensureAllowlistedSession(client, "abc")).resolves.toBeNull();
    expect(spies.signOut).not.toHaveBeenCalled();
  });
});

describe("getSessionUserRole", () => {
  it("returns null when the session user cannot be loaded", async () => {
    const { client, spies } = createSupabaseClient();
    spies.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(getSessionUserRole(client)).resolves.toBeNull();
    expect(spies.from).not.toHaveBeenCalled();
  });

  it("retrieves the role on the first successful lookup", async () => {
    const { client, spies } = createSupabaseClient();
    spies.getUser.mockResolvedValue({ data: { user: { id: "user-3" } }, error: null });
    spies.maybeSingle.mockResolvedValue({ data: { role: "teacher" }, error: null });

    await expect(getSessionUserRole(client)).resolves.toBe("teacher");
    expect(spies.from).toHaveBeenCalledWith("profiles");
  });

  it("retries when the role record is not ready yet", async () => {
    const { client, spies } = createSupabaseClient();
    const setTimeoutMock = vi.spyOn(globalThis, "setTimeout").mockImplementation(((callback: TimerHandler) => {
      if (typeof callback === "function") {
        callback();
      }
      return 0 as unknown as number;
    }) as typeof setTimeout);

    spies.getUser.mockResolvedValue({ data: { user: { id: "user-4" } }, error: null });
    spies.maybeSingle
      .mockResolvedValueOnce({ data: null, error: new Error("not ready") })
      .mockResolvedValueOnce({ data: { role: "admin" }, error: null });

    await expect(getSessionUserRole(client)).resolves.toBe("admin");
    expect(spies.maybeSingle).toHaveBeenCalledTimes(2);
    expect(setTimeoutMock).toHaveBeenCalledTimes(1);
  });
});