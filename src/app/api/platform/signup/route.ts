import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitOrDeny } from "@/lib/rate-limit";

const SignupSchema = z.object({
  companyName: z.string().trim().min(2).max(150),
  legalName: z.string().trim().max(150).optional(),
  adminFirstName: z.string().trim().min(1).max(100),
  adminLastName: z.string().trim().min(1).max(100),
  adminEmail: z.string().email(),
  timezone: z.string().trim().max(60).optional(),
  plan: z.enum(["starter", "pro", "enterprise"]).optional(),
});

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base || "org"}-${suffix}`;
}

export async function POST(req: NextRequest) {
  const limited = await rateLimitOrDeny(req, "platform-signup", { windowSeconds: 3600, max: 5 });
  if (limited) return limited;

  try {
    const parsed = SignupSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid signup data.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { companyName, legalName, adminFirstName, adminLastName, adminEmail, timezone, plan } =
      parsed.data;

    const admin = createAdminClient();
    const email = adminEmail.toLowerCase();

    // One org per admin email — reject if this email already administers a tenant.
    const { data: existingAdmin } = await admin
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingAdmin) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in instead." },
        { status: 409 }
      );
    }

    const slug = slugify(companyName);

    const { data: org, error: orgError } = await admin
      .from("orgs")
      .insert({
        slug,
        name: companyName,
        legal_name: legalName || companyName,
        plan: plan === "enterprise" ? "enterprise" : plan === "pro" ? "growth" : "starter",
        timezone: timezone || "America/New_York",
        admin_email: email,
        app_base_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      })
      .select("id, slug")
      .single();

    if (orgError || !org) {
      console.error("[platform/signup] org insert error:", orgError);
      return NextResponse.json({ error: "Failed to create your organization." }, { status: 500 });
    }

    const { error: adminInsertError } = await admin.from("admin_users").insert({
      org_id: org.id,
      email,
      role: "admin",
    });
    if (adminInsertError) {
      console.error("[platform/signup] admin_users insert error:", adminInsertError);
      return NextResponse.json({ error: "Failed to create your admin account." }, { status: 500 });
    }

    await admin.from("org_branding").insert({
      org_id: org.id,
      public_name: companyName,
      sender_name: companyName,
      booking_headline: "Book your free consultation",
      referral_headline: `Refer a client to ${companyName}`,
    });

    await admin.from("tenant_signups").insert({
      org_id: org.id,
      company_name: companyName,
      admin_first_name: adminFirstName,
      admin_last_name: adminLastName,
      admin_email: email,
      plan: plan ?? "starter",
      status: "provisioned",
    });

    // Send a magic link so the new admin can log in immediately.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback`,
    });

    return NextResponse.json({ success: true, orgSlug: org.slug });
  } catch (err) {
    console.error("[platform/signup] unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
