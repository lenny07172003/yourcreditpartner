import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/public/unsubscribe
 *
 * Handles unsubscribe requests for both:
 *  - Referred clients (by referralId) — opts out of nurture emails
 *  - Partners (by partnerId) — marks email preference (future use)
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { referralId, partnerId } = body as {
    referralId?: string;
    partnerId?: string;
  };

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (referralId) {
    await admin
      .from("referrals")
      .update({
        nurture_status: "opted_out",
        nurture_opted_out_at: now,
      })
      .eq("id", referralId);

    // Cancel any pending queued emails
    await admin
      .from("client_nurture_queue")
      .update({
        cancelled_at: now,
        cancelled_reason: "client_unsubscribed",
      })
      .eq("referral_id", referralId)
      .is("sent_at", null)
      .is("cancelled_at", null);
  }

  if (partnerId) {
    // Log unsubscribe event for the partner
    await admin.from("partner_events").insert({
      partner_id: partnerId,
      actor: "partner",
      event_type: "partner_unsubscribed",
      payload: { unsubscribed_at: now },
    });
  }

  return NextResponse.json({ success: true });
}
