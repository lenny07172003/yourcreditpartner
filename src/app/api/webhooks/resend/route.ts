import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { OCG_ORG_ID } from "@/lib/org/context";
import { markWebhookEventProcessed, recordWebhookEvent } from "@/lib/integrations/webhook-events";

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyResendWebhook(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    return null;
  }

  const token =
    req.headers.get("x-webhook-token") ??
    req.headers.get("x-ycp-secret") ??
    req.nextUrl.searchParams.get("token");

  if (!token || !safeCompare(secret, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  return null;
}

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
  const deny = verifyResendWebhook(req);
  if (deny) return deny;

  const body = await req.json();
  const { type, data } = body as {
    type: string;
    data: { email_id?: string; created_at?: string };
  };

  const admin = createAdminClient();
  const recorded = await recordWebhookEvent(admin, {
    orgId: OCG_ORG_ID,
    provider: "resend",
    externalEventId: data?.email_id ? `${type}:${data.email_id}:${data.created_at ?? ""}` : null,
    eventType: type,
    payload: body as Record<string, unknown>,
  });

  if (recorded.duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!data?.email_id) {
    await markWebhookEventProcessed(admin, recorded.id);
    return NextResponse.json({ received: true });
  }

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
    await markWebhookEventProcessed(admin, recorded.id);
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

  await markWebhookEventProcessed(admin, recorded.id);

  return NextResponse.json({ received: true, event: type });
}
