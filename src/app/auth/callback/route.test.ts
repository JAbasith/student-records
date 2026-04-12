import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  ensureAllowlistedSessionMock: vi.fn(),
  getDashboardRouteForRoleMock: vi.fn((role: string) => `/${role}`),
  getSessionUserRoleMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClientMock,
}));

vi.mock("@/features/auth/server/session-authorization", () => ({
  ensureAllowlistedSession: mocks.ensureAllowlistedSessionMock,
  getSessionUserRole: mocks.getSessionUserRoleMock,
}));

vi.mock("@/features/access-control", () => ({
  getDashboardRouteForRole: mocks.getDashboardRouteForRoleMock,
}));

import { GET } from "./route";

describe("auth callback route", () => {
  it("redirects to login when the allowlist RPC rejects the user", async () => {
    mocks.createClientMock.mockResolvedValue({});
    mocks.ensureAllowlistedSessionMock.mockResolvedValue("not-approved");

    const response = await GET(new Request("https://example.com/auth/callback?code=abc"));

    expect(response.headers.get("location")).toBe("https://example.com/login?error=not-approved");
    expect(mocks.getSessionUserRoleMock).not.toHaveBeenCalled();
  });

  it("redirects to the role dashboard after a successful sign-in", async () => {
    mocks.createClientMock.mockResolvedValue({});
    mocks.ensureAllowlistedSessionMock.mockResolvedValue(null);
    mocks.getSessionUserRoleMock.mockResolvedValue("teacher");

    const response = await GET(new Request("https://example.com/auth/callback?code=abc"));

    expect(response.headers.get("location")).toBe("https://example.com/teacher");
    expect(mocks.getDashboardRouteForRoleMock).toHaveBeenCalledWith("teacher");
  });

  it("respects a safe next path when one is provided", async () => {
    const response = await GET(new Request("https://example.com/auth/callback?next=/reports"));

    expect(response.headers.get("location")).toBe("https://example.com/reports");
  });
});