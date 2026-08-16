import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitOrDeny } from "@/lib/rate-limit";
import { createTenantOrg } from "@/lib/org/createTenant";

const SignupSchema = z.object({
  companyName: z.string().trim().min(2).max(150),
  legalName: z.string().trim().max(150).optional(),
  adminFirstName: z.string().trim().min(1).max(100),
  adminLastName: z.string().trim().min(1).max(100),
  adminEmail: z.string().email(),
  timezone: z.string().trim().max(60).optional(),
  plan: z.enum(["starter", "pro", "enterprise"]).optional(),
});

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

    let org;
    try {
      org = await createTenantOrg(admin, {
        companyName,
        legalName,
        adminEmail: email,
        timezone,
        plan,
        kind: "company",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create your organization.";
      console.error("[platform/signup] createTenantOrg error:", err);
      return NextResponse.json({ error: message }, { status: 409 });
    }

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
