import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AvailabilityManager from "./AvailabilityManager";

export default async function SalesRepDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const admin = createAdminClient();
  const { data: rep } = await admin.from("sales_reps").select("id, first_name, last_name").eq("auth_user_id", user.id).eq("status", "active").is("deleted_at", null).maybeSingle();
  if (!rep) redirect("/dashboard");
  const [{ data: rules }, { data: bookings }] = await Promise.all([
    admin.from("calendar_availability").select("weekday, start_time, end_time, timezone, buffer_before_min, buffer_after_min").eq("sales_rep_id", rep.id).eq("active", true).order("weekday"),
    admin.from("calendar_bookings").select("id, scheduled_for, status, referrals!inner(client_first_name, client_last_name)").eq("sales_rep_id", rep.id).in("status", ["booked", "rescheduled"]).gte("scheduled_for", new Date().toISOString()).order("scheduled_for").limit(10),
  ]);
  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-brand-50 p-2.5"><CalendarDays className="size-5 text-brand-600" /></div><div><h1 className="text-2xl font-bold text-ink">Closer calendar</h1><p className="mt-1 text-sm text-ink-muted">Welcome, {rep.first_name}. Set the times clients can book with you.</p></div></div><AvailabilityManager initialRules={rules ?? []} /><section className="rounded-xl border border-line bg-surface p-5"><h2 className="text-base font-semibold text-ink">Upcoming consultations</h2><div className="mt-4 divide-y divide-line">{(bookings ?? []).length ? bookings?.map((booking) => { const referral = booking.referrals as unknown as { client_first_name: string; client_last_name: string }; return <div key={booking.id} className="flex items-center justify-between py-3 text-sm"><span className="font-medium text-ink">{referral.client_first_name} {referral.client_last_name}</span><span className="text-ink-muted">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(booking.scheduled_for))}</span></div>; }) : <p className="py-6 text-sm text-ink-muted">No upcoming consultations.</p>}</div></section></div>;
}
