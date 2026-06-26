import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerByAuthId, logPartnerEvent } from "@/lib/supabase/queries";
import { pushReferralToGhl } from "@/lib/ghl/push-contact";
import { sendBookingInvite } from "@/lib/calendar/notifications";

const ReferralSchema = z.object({
  clientFirstName: z.string().min(1).max(100),
  clientLastName: z.string().min(1).max(100),
  clientEmail: z.string().email(),
  clientPhone: z.string().max(30).optional(),
  clientState: z.string().max(2).optional(),
  clientSituation: z.string().max(2000).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ referrals: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = ReferralSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { clientFirstName, clientLastName, clientEmail, clientPhone, clientState, clientSituation } =
    parsed.data;

  const admin = createAdminClient();

  // Create referral record
  const { data: referral, error: insertError } = await admin
    .from("referrals")
    .insert({
      partner_id: partner.id,
      partner_type: partner.partner_type,
      submission_path: "partner_filled",
      client_first_name: clientFirstName,
      client_last_name: clientLastName,
      client_email: clientEmail.toLowerCase(),
      client_phone: clientPhone ?? null,
      client_state: clientState ?? null,
      client_situation: clientSituation ?? null,
      stage: "submitted",
    })
    .select("id")
    .single();

  if (insertError || !referral) {
    console.error("[referrals] insert error:", insertError);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }

  // Update partner's last submission timestamp
  await admin
    .from("partners")
    .update({ last_submission_at: new Date().toISOString() })
    .eq("id", partner.id);

  // Log event
  await logPartnerEvent(admin, {
    partner_id: partner.id,
    actor: "partner",
    event_type: "referral_submitted",
    payload: {
      referral_id: referral.id,
      client_email: clientEmail.toLowerCase(),
    },
  });

  // Push to GHL (async — don't block response)
  pushReferralToGhl(admin, referral.id, {
    clientFirstName,
    clientLastName,
    clientEmail: clientEmail.toLowerCase(),
    clientPhone: clientPhone ?? undefined,
    partnerId: partner.id,
    partnerSlug: partner.partner_slug,
    partnerType: partner.partner_type,
    partnerFirstName: partner.first_name,
    partnerLastName: partner.last_name,
    partnerCompany: partner.company_name ?? undefined,
  }).catch((err) => console.error("[referrals] GHL push failed:", err));

  const bookingUrl = await sendBookingInvite({
    referralId: referral.id,
    clientName: clientFirstName,
    clientEmail: clientEmail.toLowerCase(),
  }).catch((err) => {
    console.error("[referrals] calendar invite failed:", err);
    return null;
  });

  return NextResponse.json({ success: true, referralId: referral.id, bookingUrl });
}
