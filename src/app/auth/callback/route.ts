import { NextResponse } from "next/server";

import { getDashboardRouteForRole } from "@/features/access-control";
import type { LoginErrorCode } from "@/features/auth/constants/login-errors";
import { ensureAllowlistedSession, getSessionUserRole } from "@/features/auth/server/session-authorization";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(requestUrl: URL, reason: LoginErrorCode) {
  const url = new URL("/login", requestUrl.origin);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedPath = requestUrl.searchParams.get("next") || "/";
  const nextPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/";

  if (code) {
    const supabase = await createClient();
    const errorCode = await ensureAllowlistedSession(supabase, code);
    if (errorCode) {
      return loginRedirect(requestUrl, errorCode);
    }

    const role = await getSessionUserRole(supabase);
    if (role && nextPath === "/") {
      const roleRedirectUrl = new URL(getDashboardRouteForRole(role), requestUrl.origin);
      return NextResponse.redirect(roleRedirectUrl);
    }
  }

  const redirectUrl = new URL(nextPath, requestUrl.origin);
  return NextResponse.redirect(redirectUrl);
}
