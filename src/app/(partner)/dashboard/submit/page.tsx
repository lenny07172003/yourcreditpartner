"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SubmitReferralPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientFirstName: "",
    clientLastName: "",
    clientEmail: "",
    clientPhone: "",
    clientState: "",
    clientSituation: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientFirstName || !form.clientLastName || !form.clientEmail) return;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/partner/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      const msg = data.error ?? "Failed to submit referral.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setBookingUrl(data.bookingUrl ?? null);
    toast.success("Referral submitted successfully!");
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-xl border border-success/30 bg-success/5 p-8">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="size-6 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-ink">Referral Submitted!</h2>
          <p className="mt-2 text-sm text-ink-muted">
            We&rsquo;ll reach out to {form.clientFirstName} and schedule their free
            consultation. You&rsquo;ll see updates on your referrals page.
          </p>
          {bookingUrl && (
            <div className="mt-4 rounded-lg border border-line bg-surface p-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Client booking link</p>
              <a href={bookingUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm font-medium text-brand-600 hover:underline">
                {bookingUrl}
              </a>
            </div>
          )}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setBookingUrl(null);
                setForm({
                  clientFirstName: "",
                  clientLastName: "",
                  clientEmail: "",
                  clientPhone: "",
                  clientState: "",
                  clientSituation: "",
                });
              }}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
            >
              Submit Another
            </button>
            <button
              onClick={() => router.push("/dashboard/referrals")}
              className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised"
            >
              View Referrals
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Submit a Referral</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter your client&rsquo;s info — we&rsquo;ll handle the rest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              First Name *
            </label>
            <input
              type="text"
              required
              value={form.clientFirstName}
              onChange={(e) => update("clientFirstName", e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={form.clientLastName}
              onChange={(e) => update("clientLastName", e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={form.clientEmail}
            onChange={(e) => update("clientEmail", e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">
            Phone Number
          </label>
          <input
            type="tel"
            value={form.clientPhone}
            onChange={(e) => update("clientPhone", e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">
            State
          </label>
          <input
            type="text"
            value={form.clientState}
            onChange={(e) => update("clientState", e.target.value)}
            placeholder="Optional"
            maxLength={2}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">
            Client&rsquo;s Situation
          </label>
          <textarea
            value={form.clientSituation}
            onChange={(e) => update("clientSituation", e.target.value)}
            placeholder="Any context about their credit needs (optional)"
            rows={3}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Referral"}
        </button>
      </form>
    </div>
  );
}
