"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ReferralPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    state: "",
    situation: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) return;

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/public/refer/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/refer/${slug}/success`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/">
            <img src="/logo.png" alt="YourCreditPartner" className="h-10 w-auto mx-auto" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">
            Free Credit Consultation
          </h1>
          <p className="mt-2 text-sm text-brand-400">
            Fill in your info below — we&rsquo;ll reach out to schedule your free
            consultation. No cost, no obligation.
          </p>
        </div>

        <div className="rounded-2xl border border-brand-800 bg-brand-900 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-brand-300">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-brand-300">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-brand-300">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-brand-300">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-brand-300">
                Tell us about your credit situation
              </label>
              <textarea
                value={form.situation}
                onChange={(e) => update("situation", e.target.value)}
                placeholder="Optional — anything you'd like us to know"
                rows={3}
                className="w-full rounded-lg border border-brand-700 bg-brand-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-brand-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-danger/20 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Get My Free Consultation"}
            </button>

            <p className="text-center text-xs text-brand-600">
              100% free. No credit card required. No obligation.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
