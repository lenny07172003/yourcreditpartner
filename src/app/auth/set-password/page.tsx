"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { PasswordStrength } from "@/components/ui/password-strength";

function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/onboarding/fast-start";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;
  const canSubmit = password.length >= 8 && password === confirm && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(next);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/">
            <img src="/logo.png" alt="YourCreditPartner" className="h-10 w-auto mx-auto" />
          </Link>
          <p className="mt-2 text-sm text-brand-400">Set your password</p>
        </div>

        <div className="rounded-2xl border border-brand-800 bg-brand-900 p-8">
          <h2 className="text-base font-semibold text-white">
            Create your password
          </h2>
          <p className="mt-1 text-sm text-brand-400">
            Set a password so you can log in anytime without a magic link.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-brand-300">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <PasswordStrength password={password} />
              {tooShort && (
                <p className="mt-1 text-xs text-danger">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-brand-300">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              {mismatch && (
                <p className="mt-1 text-xs text-danger">Passwords don&rsquo;t match</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-danger/20 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Set password & continue"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-brand-600">
            You can always log in with a magic link if you forget your password.
          </p>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push(next)}
              className="text-xs text-brand-500 hover:text-brand-300"
            >
              Skip for now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-950" />}>
      <SetPasswordForm />
    </Suspense>
  );
}
