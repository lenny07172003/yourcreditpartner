"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Mail } from "lucide-react";

type Mode = "password" | "magic";

export default function LoginPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/">
            <img src="/logo.png" alt="YourCreditPartner" className="h-10 w-auto mx-auto" />
          </Link>
          <p className="mt-2 text-sm text-brand-400">Partner login</p>
        </div>

        <div className="rounded-2xl border border-brand-800 bg-brand-900 p-8">
          {magicSent ? (
            /* Magic link sent confirmation */
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-800">
                <Mail className="size-6 text-brand-400" />
              </div>
              <h2 className="text-base font-semibold text-white">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-brand-400">
                We sent a magic link to{" "}
                <span className="text-brand-300">{email}</span>. Click it to
                sign in.
              </p>
              <button
                onClick={() => { setMagicSent(false); setMode("password"); }}
                className="mt-5 text-xs text-brand-500 hover:text-brand-300"
              >
                Back to login
              </button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="mb-6 flex rounded-lg border border-brand-700 p-1">
                <button
                  onClick={() => { setMode("password"); setError(null); }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    mode === "password"
                      ? "bg-brand-600 text-white"
                      : "text-brand-400 hover:text-white"
                  }`}
                >
                  Email & Password
                </button>
                <button
                  onClick={() => { setMode("magic"); setError(null); }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    mode === "magic"
                      ? "bg-brand-600 text-white"
                      : "text-brand-400 hover:text-white"
                  }`}
                >
                  Magic Link
                </button>
              </div>

              {mode === "password" ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-brand-300">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-brand-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setMode("magic"); setError(null); }}
                        className="text-xs text-brand-500 hover:text-brand-300"
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
                      className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {error && <p className="text-xs text-danger">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-brand-300">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-xs text-brand-500">
                    We&rsquo;ll email you a one-click sign-in link. No password needed.
                  </p>

                  {error && <p className="text-xs text-danger">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
                  >
                    {loading ? "Sending…" : "Send magic link"}
                  </button>
                </form>
              )}

              <p className="mt-5 text-center text-xs text-brand-600">
                Not a partner yet?{" "}
                <Link href="/apply" className="text-brand-400 hover:text-white">
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
