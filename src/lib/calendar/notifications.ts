import { sendEmail } from "@/lib/email/resend";
import { createBookingToken } from "@/lib/calendar/token";

export async function sendBookingInvite(input: {
  referralId: string;
  orgId: string;
  clientName: string;
  clientEmail: string;
}) {
  const token = await createBookingToken(input.referralId, input.orgId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("[calendar] NEXT_PUBLIC_APP_URL is not set");
  const bookingUrl = `${appUrl}/book/${token}`;
  await sendEmail({
    to: input.clientEmail,
    subject: "Book your free credit consultation",
    html: `<p>Hi ${input.clientName},</p><p>Thank you for your interest. Choose a time for your free consultation:</p><p><a href="${bookingUrl}">Book your consultation</a></p><p>— YourCreditPartner</p>`,
    tags: [{ name: "campaign", value: "calendar_booking_invite" }],
  });
  return bookingUrl;
}

export async function sendBookingConfirmation(input: {
  bookingId: string;
  token: string;
  clientName: string;
  clientEmail: string;
  startsAt: string;
  timezone: string;
  salesRepName: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("[calendar] NEXT_PUBLIC_APP_URL is not set");
  const when = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: input.timezone }).format(new Date(input.startsAt));
  const icsUrl = `${appUrl}/api/public/bookings/${input.bookingId}/ics?token=${encodeURIComponent(input.token)}`;
  return sendEmail({
    to: input.clientEmail,
    subject: "Your consultation is confirmed",
    html: `<p>Hi ${input.clientName},</p><p>Your consultation with ${input.salesRepName} is confirmed for <strong>${when}</strong>.</p><p><a href="${icsUrl}">Add it to your calendar</a></p><p>— YourCreditPartner</p>`,
    tags: [{ name: "campaign", value: "calendar_booking_confirmation" }],
  });
}
