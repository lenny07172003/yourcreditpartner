export interface GhlAppointmentPayload {
  type: string | null;
  contactId: string | null;
  appointmentId: string | null;
  calendarId: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string | null;
  title: string | null;
}

export function extractAppointmentPayload(
  body: Record<string, unknown>
): GhlAppointmentPayload {
  return {
    type: (body.type ?? body.event_type ?? null) as string | null,
    contactId: (body.contactId ?? body.contact_id ?? null) as string | null,
    appointmentId: (body.appointmentId ?? body.appointment_id ?? null) as string | null,
    calendarId: (body.calendarId ?? body.calendar_id ?? null) as string | null,
    startTime: (body.startTime ?? body.start_time ?? null) as string | null,
    endTime: (body.endTime ?? body.end_time ?? null) as string | null,
    status: (body.status ?? null) as string | null,
    title: (body.title ?? null) as string | null,
  };
}
