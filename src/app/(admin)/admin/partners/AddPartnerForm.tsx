"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";

type PartnerType = { slug: string; display_name: string };

export function AddPartnerForm({
  partnerTypes,
  seatsUsed,
  seatLimit,
}: {
  partnerTypes: PartnerType[];
  seatsUsed: number;
  seatLimit: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const atLimit = seatsUsed >= seatLimit;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    partnerType: partnerTypes[0]?.slug ?? "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();

    setSaving(false);
    if (!res.ok) {
      toast.error(body.error ?? "Could not add partner.");
      return;
    }

    toast.success("Partner invited — they'll get an email to sign in and complete their agreement.");
    setOpen(false);
    setForm({ firstName: "", lastName: "", email: "", phone: "", partnerType: partnerTypes[0]?.slug ?? "" });
    router.refresh();
  }

  if (atLimit && !open) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
        Seat limit reached ({seatsUsed}/{seatLimit}). Contact us to purchase additional seats at $25/mo each.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
      >
        <UserPlus className="size-4" />
        Add Partner
      </button>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Add Partner</h3>
        <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink">
          <X className="size-4" />
        </button>
      </div>

      {atLimit ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Seat limit reached ({seatsUsed}/{seatLimit}). Contact us to purchase additional seats at $25/mo each.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="text"
              required
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <input
            type="tel"
            required
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <select
            required
            value={form.partnerType}
            onChange={(e) => update("partnerType", e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            {partnerTypes.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.display_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? "Sending invite…" : "Send Invite"}
          </button>
        </form>
      )}
    </div>
  );
}
