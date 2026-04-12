import { describe, expect, it } from "vitest";

import { getLoginErrorCodeFromSearch } from "./get-login-error-code";

describe("getLoginErrorCodeFromSearch", () => {
  it("returns a supported login error code", () => {
    expect(getLoginErrorCodeFromSearch("?error=not-approved")).toBe("not-approved");
  });

  it("returns null for unknown error codes", () => {
    expect(getLoginErrorCodeFromSearch("?error=unknown")).toBeNull();
  });
});