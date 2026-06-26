"use client";

import { useState } from "react";
import { toast } from "sonner";

type Rule = { weekday: number; start_time: string; end_time: string; timezone: string; buffer_before_min: number; buffer_after_min: number };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityManager({ initialRules }: { initialRules: Rule[] }) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [saving, setSaving] = useState(false);
  const activeRule = (weekday: number) => rules.find((rule) => rule.weekday === weekday);
  function update(weekday: number, changes: Partial<Rule>) {
    setRules((current) => current.map((rule) => rule.weekday === weekday ? { ...rule, ...changes } : rule));
  }
  function toggle(weekday: number, enabled: boolean) {
    setRules((current) => enabled ? [...current, { weekday, start_time: "09:00", end_time: "17:00", timezone, buffer_before_min: 5, buffer_after_min: 5 }] : current.filter((rule) => rule.weekday !== weekday));
  }
  async function save() {
    setSaving(true);
    const res = await fetch("/api/sales-rep/availability", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules: rules.map((rule) => ({ weekday: rule.weekday, startTime: rule.start_time, endTime: rule.end_time, timezone: rule.timezone, bufferBeforeMin: rule.buffer_before_min, bufferAfterMin: rule.buffer_after_min })) }) });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) return toast.error(body.error ?? "Could not save availability.");
    toast.success("Availability saved.");
  }
  return <section className="rounded-xl border border-line bg-surface p-5"><div><h2 className="text-base font-semibold text-ink">Weekly availability</h2><p className="mt-1 text-sm text-ink-muted">Clients can choose from these 30-minute appointment times. Times are saved in the selected IANA time zone.</p></div><div className="mt-5 space-y-3">{DAYS.map((day, weekday) => { const rule = activeRule(weekday); return <div key={day} className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-[130px_1fr_1fr_1.2fr] sm:items-center"><label className="flex items-center gap-2 text-sm font-medium text-ink"><input type="checkbox" checked={!!rule} onChange={(event) => toggle(weekday, event.target.checked)} className="size-4 accent-brand-600" />{day}</label>{rule ? <><input type="time" value={rule.start_time.slice(0, 5)} onChange={(event) => update(weekday, { start_time: event.target.value })} className="rounded-md border border-line px-2 py-2 text-sm" /><input type="time" value={rule.end_time.slice(0, 5)} onChange={(event) => update(weekday, { end_time: event.target.value })} className="rounded-md border border-line px-2 py-2 text-sm" /><input value={rule.timezone} onChange={(event) => update(weekday, { timezone: event.target.value })} aria-label={`${day} time zone`} className="rounded-md border border-line px-2 py-2 text-sm" /></> : <p className="text-sm text-ink-muted sm:col-span-3">Unavailable</p>}</div>; })}</div><div className="mt-5 flex items-center justify-between"><p className="text-xs text-ink-muted">Default buffers: 5 minutes before and after each consultation.</p><button onClick={save} disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50">{saving ? "Saving…" : "Save availability"}</button></div></section>;
}
