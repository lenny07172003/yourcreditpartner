"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

export function AddCompanyForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ companyName: "", adminEmail: "", plan: "starter" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/super-admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) return toast.error(body.error ?? "Could not create company.");
    toast.success("Company created — invite sent to their admin.");
    setForm({ companyName: "", adminEmail: "", plan: "starter" });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-ink">Add Company</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          type="text"
          required
          placeholder="Company name"
          value={form.companyName}
          onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
          className={inputClass}
        />
        <input
          type="email"
          required
          placeholder="Company admin email"
          value={form.adminEmail}
          onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create Company"}
        </button>
      </form>
    </div>
  );
}
