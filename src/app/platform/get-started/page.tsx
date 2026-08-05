"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

export default function GetStartedPage() {
  const [form, setForm] = useState({
    companyName: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/platform/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/platform">
            <Image src="/logo.png" alt="YourCreditPartner" width={160} height={40} className="mx-auto h-10 w-auto" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-ink">Set up your instance</h1>
          <p className="mt-2 text-sm text-ink-muted">
            No credit card required. You&rsquo;ll get a magic link to log in and finish setup.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50">
                <Mail className="size-6 text-brand-600" />
              </div>
              <h2 className="text-base font-semibold text-ink">Check your email</h2>
              <p className="mt-2 text-sm text-ink-muted">
                We sent a login link to{" "}
                <span className="font-medium text-ink">{form.adminEmail}</span>. Click it to access
                your new admin dashboard.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Company name</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  placeholder="Acme Credit Solutions"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">First name</label>
                  <input
                    type="text"
                    required
                    value={form.adminFirstName}
                    onChange={(e) => update("adminFirstName", e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Last name</label>
                  <input
                    type="text"
                    required
                    value={form.adminLastName}
                    onChange={(e) => update("adminLastName", e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Work email</label>
                <input
                  type="email"
                  required
                  value={form.adminEmail}
                  onChange={(e) => update("adminEmail", e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
              >
                {loading ? "Setting up…" : "Create My Instance"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
