import type { UserRole } from "@/features/access-control/access-control.types";

import type { LoginErrorCode } from "../constants/login-errors";

type UserMetadata = {
  full_name?: unknown;
  name?: unknown;
};

type SessionUser = {
  id: string;
  email?: string | null;
  user_metadata?: UserMetadata;
};

type SessionAuthorizationClient = {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
    getUser: () => Promise<{ data: { user: SessionUser | null }; error: Error | null }>;
    signOut: () => Promise<unknown>;
  };
  rpc: (
    fn: string,
    params: { p_user_id: string; p_email: string; p_full_name: string | null },
  ) => PromiseLike<{ data: boolean | null; error: Error | null }>;
  from: (table: "profiles") => {
    select: (columns: "role") => {
      eq: (
        column: "id",
        value: string,
      ) => {
        maybeSingle: () => PromiseLike<{ data: { role: UserRole } | null; error: Error | null }>;
      };
    };
  };
};

function parseFullName(user: SessionUser): string | null {
  const raw = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function ensureAllowlistedSession(
  supabase: unknown,
  code: string,
): Promise<LoginErrorCode | null> {
  const client = supabase as SessionAuthorizationClient;

  const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return "oauth-exchange-failed";
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user || !user.email) {
    await client.auth.signOut();
    return "session-user-missing";
  }

  const { data: isApproved, error: approvalError } = await client.rpc(
    "upsert_profile_from_allowlist",
    {
      p_user_id: user.id,
      p_email: user.email,
      p_full_name: parseFullName(user),
    },
  );

  if (approvalError || !isApproved) {
    await client.auth.signOut();
    return "not-approved";
  }

  return null;
}

export async function getSessionUserRole(supabase: unknown): Promise<UserRole | null> {
  const client = supabase as SessionAuthorizationClient;

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Retry logic: sometimes there's a slight delay before the profile is queryable
  // due to transaction isolation. Retry up to 5 times with increasing delays.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      console.log("DEBUG: getSessionUserRole found role on attempt", attempt + 1, ":", data.role);
      return data.role;
    }

    if (attempt < 4) {
      const delayMs = 200 * (attempt + 1); // 200ms, 400ms, 600ms, 800ms
      console.log("DEBUG: getSessionUserRole retry attempt", attempt + 2, "after", delayMs, "ms");
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}
