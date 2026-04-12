"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/features/auth/components/google-icon";
import { LOGIN_ERROR_MESSAGES } from "@/features/auth/constants/login-errors";
import { getLoginErrorCodeFromSearch } from "@/features/auth/utils/get-login-error-code";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginErrorCode = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return getLoginErrorCodeFromSearch(window.location.search);
  }, []);

  const loginError = loginErrorCode ? LOGIN_ERROR_MESSAGES[loginErrorCode] : null;
  const displayError = error ?? loginError;

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const callbackUrl = `${siteUrl || window.location.origin}/auth/callback?next=/`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--brand-bg) px-5 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(12,74,110,0.16),transparent_44%),radial-gradient(circle_at_88%_12%,rgba(20,83,45,0.14),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(194,65,12,0.08),transparent_45%)]" />
      <Card className="relative z-10 w-full max-w-md border-border/70 bg-card/95 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-md">
        <CardHeader className="space-y-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-(--brand-tag-bg) px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-(--brand-tag-text)">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Sign-In
          </p>
          <CardTitle className="text-3xl font-semibold tracking-tight text-(--brand-ink) sm:text-[2rem]">
            Welcome back
          </CardTitle>
          <CardDescription className="max-w-sm text-base leading-7 text-(--brand-muted)">
            Continue to Student Records using your Google account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="h-11 w-full justify-center gap-2 rounded-xl bg-(--brand-button) text-base font-semibold text-white shadow-sm hover:bg-(--brand-button-hover)"
            disabled={isLoading}
            onClick={signInWithGoogle}
          >
            <GoogleIcon />
            {isLoading ? "Redirecting to Google..." : "Continue with Google"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>

          {displayError ? (
            <p className="rounded-xl border border-(--brand-error-border) bg-(--brand-error-bg) px-4 py-3 text-sm leading-6 text-(--brand-error-text)">
              {displayError}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
