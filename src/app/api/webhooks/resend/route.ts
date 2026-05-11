import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/webhooks/resend
 *
 * Resend sends delivery events here:
 *  - email.delivered
 *  - email.opened
 *  - email.clicked
 *  - email.bounced
 *  - email.complained
 *
 * Updates client_nurture_sends with delivery timestamps.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, data } = body as {
    type: string;
    data: { email_id?: string; created_at?: string };
  };

  if (!data?.email_id) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const timestamp = data.created_at ?? new Date().toISOString();

  // Map Resend event types to our column names
  const columnMap: Record<string, string> = {
    "email.delivered": "delivered_at",
    "email.opened": "opened_at",
    "email.clicked": "clicked_at",
    "email.bounced": "bounced_at",
    "email.complained": "complained_at",
  };

  const column = columnMap[type];
  if (!column) {
    return NextResponse.json({ received: true, skipped: true });
  }

  // Update nurture sends
  await admin
    .from("client_nurture_sends")
    .update({ [column]: timestamp })
    .eq("resend_message_id", data.email_id);

  // Also update partner email sends
  await admin
    .from("email_sends")
    .update({ [column === "opened_at" ? "opened_at" : "clicked_at"]: timestamp })
    .eq("resend_message_id", data.email_id);

  return NextResponse.json({ received: true, event: type });
}
