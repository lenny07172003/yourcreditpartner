"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

function ApplySuccessContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [sent, setSent] = useState(false);
  const [resending, setResending] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Auto-send magic link on mount
  useEffect(() => {
    if (!email) return;
    supabase.auth
      .signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      .then(() => setSent(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function resend() {
    setResending(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-100">
          <span className="text-3xl">✉️</span>
        </div>

        <h1 className="mt-5 text-xl font-bold text-ink">
          Application received!
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          We&rsquo;ve sent a magic link to{" "}
          <span className="font-semibold text-ink">{email}</span>. Click it to
          log into your new partner dashboard.
        </p>

        <p className="mt-4 text-xs text-ink-muted">
          Check your spam folder if you don&rsquo;t see it within a few minutes.
        </p>

        <button
          onClick={resend}
          disabled={resending}
          className="mt-6 text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend login link"}
        </button>

        <div className="mt-8 border-t border-line pt-6">
          <Link href="/" className="text-xs text-ink-muted hover:text-ink">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ApplySuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface-soft" />}>
      <ApplySuccessContent />
    </Suspense>
  );
}
