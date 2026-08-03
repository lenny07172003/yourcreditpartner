"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Clock, LoaderCircle, MapPin } from "lucide-react";
import type { AvailableCalendarSlot } from "@/lib/calendar/types";

type AvailabilityResponse = {
  referral: { firstName: string; lastName: string };
  slots: AvailableCalendarSlot[];
  branding?: {
    public_name: string;
    primary_color: string;
    accent_color: string;
    booking_headline: string;
  };
};

function displayDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: timezone }).format(new Date(value));
}
function displayTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(value));
}

export default function BookingWidget({ token }: { token: string }) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [selected, setSelected] = useState<AvailableCalendarSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ bookingId: string; startsAt: string; endsAt: string; salesRepName: string } | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    fetch(`/api/public/availability/${encodeURIComponent(token)}`)
      .then(async (res) => ({ ok: res.ok, body: await res.json() }))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.error ?? "Could not load available times.");
        setData(body);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const slotGroups = useMemo(() => {
    const groups = new Map<string, AvailableCalendarSlot[]>();
    for (const slot of data?.slots ?? []) {
      const key = displayDate(slot.startsAt, timezone);
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }
    return [...groups.entries()].slice(0, 7);
  }, [data?.slots, timezone]);

  const branding = data?.branding;
  const headerStyle = branding
    ? { backgroundImage: `linear-gradient(90deg, ${branding.primary_color}, ${branding.accent_color})` }
    : undefined;

  async function confirmBooking() {
    if (!selected) return;
    setBooking(true);
    setError(null);
    const res = await fetch("/api/public/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, startsAt: selected.startsAt, clientTimezone: timezone }) });
    const body = await res.json();
    setBooking(false);
    if (!res.ok) return setError(body.error ?? "Could not confirm your appointment.");
    setConfirmation(body);
  }

  async function cancelBooking() {
    if (!confirmation) return;
    setBooking(true);
    const res = await fetch(`/api/public/bookings/${confirmation.bookingId}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const body = await res.json();
    setBooking(false);
    if (!res.ok) return setError(body.error ?? "Could not cancel your appointment.");
    setCancelled(true);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-surface-soft text-sm text-ink-muted"><LoaderCircle className="mr-2 size-4 animate-spin" /> Loading available times…</div>;
  if (error && !data) return <main className="mx-auto flex min-h-screen max-w-lg items-center p-6"><div className="w-full rounded-xl border border-danger/30 bg-surface p-6 text-center"><h1 className="text-lg font-bold text-ink">Booking link unavailable</h1><p className="mt-2 text-sm text-ink-muted">{error}</p></div></main>;
  if (confirmation) return <main className="min-h-screen bg-surface-soft p-4 sm:p-8"><section className="mx-auto max-w-xl rounded-2xl border border-line bg-surface p-7 text-center shadow-sm"><div className={`mx-auto flex size-12 items-center justify-center rounded-full ${cancelled ? "bg-surface-raised" : "bg-success/10"}`}><CalendarCheck2 className={`size-6 ${cancelled ? "text-ink-muted" : "text-success"}`} /></div><h1 className="mt-4 text-2xl font-bold text-ink">{cancelled ? "Appointment cancelled" : "You’re booked"}</h1><p className="mt-2 text-sm text-ink-muted">{cancelled ? "You can use the same secure link to choose a new time." : `Your consultation is confirmed with ${confirmation.salesRepName}.`}</p><div className="mt-6 rounded-xl bg-surface-raised p-4 text-left"><p className="font-semibold text-ink">{displayDate(confirmation.startsAt, timezone)}</p><p className="mt-1 text-sm text-ink-muted">{displayTime(confirmation.startsAt, timezone)} – {displayTime(confirmation.endsAt, timezone)} · {timezone}</p></div>{cancelled ? <button onClick={() => { setCancelled(false); setConfirmation(null); setSelected(null); }} className="mt-5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500">Choose a new time</button> : <div className="mt-5 flex flex-wrap justify-center gap-3"><a className="inline-flex rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500" href={`/api/public/bookings/${confirmation.bookingId}/ics?token=${encodeURIComponent(token)}`}>Add to calendar</a><button onClick={() => setConfirmation(null)} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-raised">Reschedule</button><button onClick={cancelBooking} disabled={booking} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/5 disabled:opacity-50">{booking ? "Cancelling…" : "Cancel"}</button></div>}{error && <p className="mt-4 text-sm text-danger">{error}</p>}</section></main>;

  return <main className="min-h-screen bg-surface-soft p-4 sm:p-8"><section className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"><div className="border-b border-line bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-7 text-white" style={headerStyle}><p className="text-sm font-medium text-white/80">{branding?.public_name ?? "YourCreditPartner"}</p><h1 className="mt-1 text-2xl font-bold">{branding?.booking_headline ?? "Book your free consultation"}</h1><p className="mt-2 text-sm text-white/85">Choose a time that works for you, {data?.referral.firstName}.</p></div><div className="p-6"><div className="mb-5 flex flex-wrap gap-4 text-xs text-ink-muted"><span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" /> 30 minutes</span><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> Times shown in {timezone}</span></div>{slotGroups.length ? <div className="space-y-6">{slotGroups.map(([date, slots]) => <div key={date}><h2 className="text-sm font-semibold text-ink">{date}</h2><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{slots.map((slot) => <button key={slot.startsAt} onClick={() => setSelected(slot)} className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${selected?.startsAt === slot.startsAt ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line text-ink hover:border-brand-300 hover:bg-brand-50"}`}>{displayTime(slot.startsAt, timezone)}</button>)}</div></div>)}</div> : <div className="rounded-xl bg-surface-raised p-6 text-center text-sm text-ink-muted">There are no available appointments in the next three weeks. Please check back soon.</div>}{selected && <div className="mt-7 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-ink">{displayDate(selected.startsAt, timezone)} at {displayTime(selected.startsAt, timezone)}</p><p className="mt-0.5 text-xs text-ink-muted">{selected.salesRepName} · {timezone}</p></div><button onClick={confirmBooking} disabled={booking} className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50">{booking ? "Confirming…" : "Confirm appointment"}</button></div>}{error && <p className="mt-4 text-sm text-danger">{error}</p>}</div></section></main>;
}
