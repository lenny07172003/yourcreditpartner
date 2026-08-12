"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Mail } from "lucide-react";

type Mode = "password" | "magic";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("Couldn't send login link. Please try again.");
    } else {
      setMagicSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="YourCreditPartner" className="h-20 w-auto mx-auto" />
          </Link>
          {/* <p className="mt-2 text-lg font-medium text-ink-muted">Partner login</p> */}
        </div>

        <div className="rounded-2xl border border-black/[0.04] bg-white p-8 shadow-[0_1px_30px_rgba(0,0,0,0.06)]">
          {magicSent ? (
            /* Magic link sent confirmation */
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50">
                <Mail className="size-6 text-brand-600" />
              </div>
              <h2 className="text-base font-semibold text-ink">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                We sent a magic link to{" "}
                <span className="font-medium text-ink">{email}</span>. Click it to
                sign in.
              </p>
              <button
                onClick={() => { setMagicSent(false); setMode("password"); }}
                className="mt-5 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Back to login
              </button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="mb-6 flex rounded-lg border border-black/[0.06] bg-surface-soft p-1">
                <button
                  onClick={() => { setMode("password"); setError(null); }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    mode === "password"
                      ? "bg-white text-ink shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Email & Password
                </button>
                <button
                  onClick={() => { setMode("magic"); setError(null); }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    mode === "magic"
                      ? "bg-white text-ink shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Magic Link
                </button>
              </div>

              {mode === "password" ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted/60 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-ink-muted">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setMode("magic"); setError(null); }}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted/60 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {error && <p className="text-xs text-danger">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted/60 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-xs text-ink-muted">
                    We&rsquo;ll email you a one-click sign-in link. No password needed.
                  </p>

                  {error && <p className="text-xs text-danger">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                  >
                    {loading ? "Sending…" : "Send magic link"}
                  </button>
                </form>
              )}

              <p className="mt-5 text-center text-xs text-ink-muted">
                Not a partner yet?{" "}
                <Link href="/apply" className="font-medium text-brand-600 hover:text-brand-700">
                  Apply now →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
