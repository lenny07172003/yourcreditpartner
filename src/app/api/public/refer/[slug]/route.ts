import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerBySlug, logPartnerEvent } from "@/lib/supabase/queries";
import { sendBookingInvite } from "@/lib/calendar/notifications";
import { fanOutWebhooks } from "@/lib/integrations/dispatch";
import { enqueueGhlJobIfEnabled } from "@/lib/integrations/outbox";
import { OCG_ORG_ID } from "@/lib/org/context";
import { rateLimitOrDeny } from "@/lib/rate-limit";

const ReferralSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  state: z.string().max(2).optional(),
  situation: z.string().max(2000).optional(),
});

interface Props {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  const limited = await rateLimitOrDeny(req, "public-refer", { windowSeconds: 3600, max: 10 });
  if (limited) return limited;

  const { slug } = await params;
  const admin = createAdminClient();

  // Find the partner by slug
  const partner = await getPartnerBySlug(admin, slug);
  if (!partner) {
    return NextResponse.json({ error: "Invalid referral link" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = ReferralSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fill in all required fields.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, phone, state, situation } = parsed.data;

  // Create referral
  const { data: referral, error: insertError } = await admin
    .from("referrals")
    .insert({
      org_id: partner.org_id ?? OCG_ORG_ID,
      partner_id: partner.id,
      partner_type: partner.partner_type,
      submission_path: "client_filled",
      client_first_name: firstName,
      client_last_name: lastName,
      client_email: email.toLowerCase(),
      client_phone: phone ?? null,
      client_state: state ?? null,
      client_situation: situation ?? null,
      stage: "submitted",
    })
    .select("id")
    .single();

  if (insertError || !referral) {
    console.error("[refer] insert error:", insertError);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }

  // Update partner's last submission timestamp
  await admin
    .from("partners")
    .update({ last_submission_at: new Date().toISOString() })
    .eq("id", partner.id);

  // Log event
  await logPartnerEvent(admin, {
    org_id: partner.org_id ?? OCG_ORG_ID,
    partner_id: partner.id,
    actor: "system",
    event_type: "referral_submitted",
    payload: {
      referral_id: referral.id,
      submission_path: "client_filled",
      client_email: email.toLowerCase(),
    },
  });

  const orgId = partner.org_id ?? OCG_ORG_ID;

  await fanOutWebhooks(admin, orgId, "referral.submitted", {
    referral_id: referral.id,
    submission_path: "client_filled",
    client_email: email.toLowerCase(),
    client_state: state ?? null,
    partner_id: partner.id,
    partner_type: partner.partner_type,
  }).catch((err) => console.error("[refer] webhook fan-out failed:", err));

  await enqueueGhlJobIfEnabled(admin, {
    orgId,
    jobType: "ghl.referral.upsert",
    aggregateType: "referral",
    aggregateId: referral.id,
    payload: {
      clientFirstName: firstName,
      clientLastName: lastName,
      clientEmail: email.toLowerCase(),
      clientPhone: phone ?? undefined,
      partnerId: partner.id,
      partnerSlug: partner.partner_slug,
      partnerType: partner.partner_type,
      partnerFirstName: partner.first_name,
      partnerLastName: partner.last_name,
      partnerCompany: partner.company_name ?? undefined,
    },
  }).catch((err) => console.error("[refer] GHL outbox enqueue failed:", err));

  const bookingUrl = await sendBookingInvite({
    referralId: referral.id,
    orgId,
    clientName: firstName,
    clientEmail: email.toLowerCase(),
  }).catch((err) => {
    console.error("[refer] calendar invite failed:", err);
    return null;
  });

  return NextResponse.json({ success: true, bookingUrl });
}
