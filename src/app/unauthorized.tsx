import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background)_88%,white))] px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
        <Card className="w-full border-border/60 bg-card/95 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <CardHeader className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-muted">Student Records</p>
            <CardTitle className="text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              401 - Unauthorized
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-brand-muted">
              You need to sign in before you can access this area. After logging in, you will be sent to the workspace that matches your role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-brand-muted">
              If you already signed in and still see this page, refresh the browser or sign out and back in so your session can be rebuilt correctly.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={buttonVariants({ className: "sm:w-auto" })}>
                Go to login
              </Link>
              <Link href="/" className={buttonVariants({ variant: "outline", className: "sm:w-auto" })}>
                Return home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}