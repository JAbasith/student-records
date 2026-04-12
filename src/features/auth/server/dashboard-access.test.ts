import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  forbiddenMock: vi.fn(() => {
    throw new Error("forbidden");
  }),
  unauthorizedMock: vi.fn(() => {
    throw new Error("unauthorized");
  }),
  getSessionUserRoleMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  forbidden: mocks.forbiddenMock,
  unauthorized: mocks.unauthorizedMock,
}));

vi.mock("./session-authorization", () => ({
  getSessionUserRole: mocks.getSessionUserRoleMock,
}));

import { getAuthenticatedUserRoleOrRedirect, requireDashboardRole } from "./dashboard-access";
import { getSessionUserRole } from "./session-authorization";

describe("dashboard access guards", () => {
  it("renders the unauthorized interrupt when there is no session role", async () => {
    vi.mocked(getSessionUserRole).mockResolvedValue(null);

    await expect(getAuthenticatedUserRoleOrRedirect({})).rejects.toThrow("unauthorized");
    expect(mocks.unauthorizedMock).toHaveBeenCalledTimes(1);
  });

  it("renders the forbidden interrupt when the role does not match", async () => {
    vi.mocked(getSessionUserRole).mockResolvedValue("student");

    await expect(requireDashboardRole({}, "admin")).rejects.toThrow("forbidden");
    expect(mocks.forbiddenMock).toHaveBeenCalledTimes(1);
  });

  it("returns the matching role unchanged", async () => {
    vi.mocked(getSessionUserRole).mockResolvedValue("teacher");

    await expect(requireDashboardRole({}, "teacher")).resolves.toBe("teacher");
  });
});