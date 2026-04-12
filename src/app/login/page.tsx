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
      <Card className="relative z-10 w-full max-w-md border-white/40 bg-white/88 shadow-[0_20px_60px_rgba(15,23,42,0.2)] backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-(--brand-tag-bg) px-3 py-1 text-xs font-semibold text-(--brand-tag-text)">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Sign-In
          </p>
          <CardTitle className="text-2xl font-semibold tracking-tight text-(--brand-ink)">
            Welcome back
          </CardTitle>
          <CardDescription className="text-(--brand-muted)">
            Continue to Student Records using your Google account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="h-11 w-full justify-center gap-2 bg-(--brand-button) text-white hover:bg-(--brand-button-hover)"
            disabled={isLoading}
            onClick={signInWithGoogle}
          >
            <GoogleIcon />
            {isLoading ? "Redirecting to Google..." : "Continue with Google"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>

          {displayError ? (
            <p className="rounded-md border border-(--brand-error-border) bg-(--brand-error-bg) px-3 py-2 text-sm text-(--brand-error-text)">
              {displayError}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
