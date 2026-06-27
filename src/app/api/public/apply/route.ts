import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushPartnerToGhl } from "@/lib/ghl/push-contact";
import { OCG_ORG_ID } from "@/lib/org/context";

const ApplySchema = z.object({
  partnerType: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  companyName: z.string().max(200).optional(),
  stateOfOperation: z.string().max(2).optional(),
  whyPartnering: z.string().max(2000).optional(),
  expectedVolume: z.enum(["1-3", "4-10", "11-25", "25+"]).optional(),
  signatureName: z.string().min(2).max(200),
  agreedToTerms: z.literal(true),
  agreementUserAgent: z.string().optional(),
  referredBySlug: z.string().optional(),
});

function generateSlug(firstName: string, lastName: string): string {
  const base = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ApplySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid application data.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      partnerType,
      firstName,
      lastName,
      email,
      phone,
      companyName,
      stateOfOperation,
      whyPartnering,
      expectedVolume,
      signatureName,
      agreementUserAgent,
      referredBySlug,
    } = parsed.data;

    const admin = createAdminClient();

    // Check for duplicate email
    const { data: existing } = await admin
      .from("partners")
      .select("id")
      .eq("org_id", OCG_ORG_ID)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Check your inbox for a login link." },
        { status: 409 }
      );
    }

    const partnerSlug = generateSlug(firstName, lastName);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    // Look up referring partner (if signed up via ?ref=slug)
    let referredByPartnerId: string | null = null;
    if (referredBySlug) {
      const { data: referrer } = await admin
        .from("partners")
        .select("id")
        .eq("org_id", OCG_ORG_ID)
        .eq("partner_slug", referredBySlug)
        .eq("status", "active")
        .maybeSingle();
      referredByPartnerId = referrer?.id ?? null;
    }

    // Create partner record
    const { error: insertError } = await admin.from("partners").insert({
      org_id: OCG_ORG_ID,
      email: email.toLowerCase(),
      phone,
      first_name: firstName,
      last_name: lastName,
      company_name: companyName ?? null,
      partner_type: partnerType,
      why_partnering: whyPartnering ?? null,
      expected_volume: expectedVolume ?? null,
      state_of_operation: stateOfOperation ?? null,
      partner_slug: partnerSlug,
      status: "active",
      agreement_signed_at: new Date().toISOString(),
      agreement_ip: ip,
      agreement_user_agent: agreementUserAgent ?? null,
      agreement_version: "v1.0",
      agreement_signature_name: signatureName,
      referred_by_partner_id: referredByPartnerId,
    });

    if (insertError) {
      console.error("[apply] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create your account. Please try again." },
        { status: 500 }
      );
    }

    // Log partner event
    const { data: partner } = await admin
      .from("partners")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (partner) {
      await admin.from("partner_events").insert({
        org_id: OCG_ORG_ID,
        partner_id: partner.id,
        actor: "system",
        event_type: "partner_applied",
        payload: { partnerType, expectedVolume: expectedVolume ?? null },
      });

      // Push partner to GHL (auto-tags with partner type + ref slug)
      // Runs async — doesn't block the response if GHL is slow/down
      pushPartnerToGhl(admin, {
        partnerId: partner.id,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        partnerSlug: partnerSlug,
        partnerType,
        companyName: companyName ?? undefined,
      }).catch((err) => console.error("[apply] GHL push failed:", err));
    }

    return NextResponse.json({ success: true, email });
  } catch (err) {
    console.error("[apply] unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error. Please try again." },
      { status: 500 }
    );
  }
}
