import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvailableCalendarSlot, CalendarAvailability, CalendarBooking } from "@/lib/calendar/types";
import { OCG_ORG_ID } from "@/lib/org/context";

const SLOT_DURATION_MIN = 30;
const LOOKAHEAD_DAYS = 21;

function formatParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function toLocalDate(date: Date, timezone: string) {
  const parts = formatParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function weekdayInTimezone(date: Date, timezone: string) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

function zonedTimeToUtc(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = new Date(desired);
  for (let attempt = 0; attempt < 2; attempt++) {
    const parts = formatParts(candidate, timezone);
    const actualAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    candidate = new Date(candidate.getTime() + (desired - actualAsUtc));
  }
  const final = formatParts(candidate, timezone);
  return Number(final.year) === year && Number(final.month) === month && Number(final.day) === day && Number(final.hour) === hour && Number(final.minute) === minute ? candidate : null;
}

function overlaps(start: Date, end: Date, blockedStart: Date, blockedEnd: Date) {
  return start < blockedEnd && end > blockedStart;
}

export async function getAvailableSlots(
  supabase: SupabaseClient,
  salesRepId: string,
  orgId: string = OCG_ORG_ID
): Promise<AvailableCalendarSlot[]> {
  const now = new Date();
  const until = new Date(now.getTime() + LOOKAHEAD_DAYS * 86_400_000);
  const [availabilityResult, bookingsResult, blocksResult, repResult] = await Promise.all([
    supabase.from("calendar_availability").select("*").eq("org_id", orgId).eq("sales_rep_id", salesRepId).eq("active", true),
    supabase.from("calendar_bookings").select("*").eq("org_id", orgId).eq("sales_rep_id", salesRepId).in("status", ["booked", "rescheduled"]).gte("scheduled_for", now.toISOString()).lt("scheduled_for", until.toISOString()),
    supabase.from("calendar_blocked_times").select("*").eq("org_id", orgId).or(`sales_rep_id.eq.${salesRepId},sales_rep_id.is.null`).lt("starts_at", until.toISOString()).gt("ends_at", now.toISOString()),
    supabase.from("sales_reps").select("first_name, last_name").eq("org_id", orgId).eq("id", salesRepId).single(),
  ]);
  if (availabilityResult.error) throw availabilityResult.error;
  if (bookingsResult.error) throw bookingsResult.error;
  if (blocksResult.error) throw blocksResult.error;
  if (repResult.error) throw repResult.error;

  const rules = (availabilityResult.data ?? []) as CalendarAvailability[];
  const bookings = (bookingsResult.data ?? []) as CalendarBooking[];
  const blocks = blocksResult.data ?? [];
  const slots: AvailableCalendarSlot[] = [];
  const usedDates = new Set<string>();

  for (const rule of rules) {
    for (let offset = 0; offset <= LOOKAHEAD_DAYS; offset++) {
      const day = new Date(now.getTime() + offset * 86_400_000);
      const localDate = toLocalDate(day, rule.timezone);
      const key = `${rule.id}:${localDate}`;
      if (usedDates.has(key) || weekdayInTimezone(day, rule.timezone) !== rule.weekday) continue;
      usedDates.add(key);

      const start = zonedTimeToUtc(localDate, rule.start_time, rule.timezone);
      const end = zonedTimeToUtc(localDate, rule.end_time, rule.timezone);
      if (!start || !end) continue;

      for (let cursor = start; cursor.getTime() + SLOT_DURATION_MIN * 60_000 <= end.getTime(); cursor = new Date(cursor.getTime() + SLOT_DURATION_MIN * 60_000)) {
        const slotEnd = new Date(cursor.getTime() + SLOT_DURATION_MIN * 60_000);
        const reservedEnd = new Date(slotEnd.getTime() + rule.buffer_after_min * 60_000);
        if (cursor <= now) continue;
        const blocked = blocks.some((block) => overlaps(cursor, reservedEnd, new Date(block.starts_at), new Date(block.ends_at)));
        const booked = bookings.some((booking) => overlaps(cursor, reservedEnd, new Date(booking.scheduled_for), new Date(new Date(booking.scheduled_for).getTime() + (booking.duration_min + booking.buffer_after_min) * 60_000)));
        if (!blocked && !booked) slots.push({
          startsAt: cursor.toISOString(), endsAt: slotEnd.toISOString(), durationMin: SLOT_DURATION_MIN,
          bufferAfterMin: rule.buffer_after_min, salesRepId, salesRepName: `${repResult.data.first_name} ${repResult.data.last_name}`,
        });
      }
    }
  }
  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function ensureReferralAssignment(supabase: SupabaseClient, referralId: string) {
  const { data, error } = await supabase.rpc("assign_referral_round_robin", { p_referral_id: referralId });
  if (error) throw error;
  return data as string;
}
