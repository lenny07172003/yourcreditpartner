export type CalendarBookingStatus = "booked" | "rescheduled" | "cancelled" | "no_show" | "attended";

export interface CalendarAvailability {
  id: string;
  sales_rep_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  timezone: string;
  active: boolean;
  buffer_before_min: number;
  buffer_after_min: number;
}

export interface CalendarBooking {
  id: string;
  referral_id: string;
  sales_rep_id: string;
  scheduled_for: string;
  duration_min: number;
  buffer_after_min: number;
  client_timezone: string;
  status: CalendarBookingStatus;
  ics_uid: string;
  reschedule_count: number;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailableCalendarSlot {
  startsAt: string;
  endsAt: string;
  durationMin: number;
  bufferAfterMin: number;
  salesRepId: string;
  salesRepName: string;
}
