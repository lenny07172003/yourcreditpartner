import type { CalendarBooking } from "@/lib/calendar/types";

function icsDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function createBookingIcs(
  booking: CalendarBooking,
  clientName: string,
  salesRepName: string
) {
  const end = new Date(new Date(booking.scheduled_for).getTime() + booking.duration_min * 60_000).toISOString();
  const now = new Date().toISOString();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//YourCreditPartner//In-House Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.ics_uid}`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(booking.scheduled_for)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs("YourCreditPartner Consultation")}`,
    `DESCRIPTION:${escapeIcs(`Consultation for ${clientName} with ${salesRepName}.`)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
