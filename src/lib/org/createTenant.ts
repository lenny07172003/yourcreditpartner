import type { SupabaseClient } from "@supabase/supabase-js";

export type CreateTenantOrgInput = {
  companyName: string;
  legalName?: string;
  adminEmail: string;
  timezone?: string;
  plan?: "starter" | "pro" | "enterprise";
  kind?: "company" | "individual";
  /** Individual-partner orgs don't get a separate admin_users row — the
   * partner logs into their own /dashboard directly, not /admin. */
  createAdminUser?: boolean;
};

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base || "org"}-${suffix}`;
}

/**
 * Creates a new tenant org + its first admin_users row + default org_branding.
 * Used by both the public signup flow (/api/platform/signup) and the Super
 * Admin "Add Company" / "Add Individual Partner" actions.
 *
 * Throws on failure — callers are responsible for catching and responding.
 */
export async function createTenantOrg(admin: SupabaseClient, input: CreateTenantOrgInput) {
  const email = input.adminEmail.toLowerCase();
  const createAdminUser = input.createAdminUser ?? true;

  if (createAdminUser) {
    const { data: existingAdmin } = await admin
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingAdmin) {
      throw new Error("An account with this email already exists.");
    }
  }

  const slug = slugify(input.companyName);

  const { data: org, error: orgError } = await admin
    .from("orgs")
    .insert({
      slug,
      name: input.companyName,
      legal_name: input.legalName || input.companyName,
      kind: input.kind ?? "company",
      plan: input.plan === "enterprise" ? "enterprise" : input.plan === "pro" ? "growth" : "starter",
      timezone: input.timezone || "America/New_York",
      admin_email: email,
      app_base_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    })
    .select("id, slug, name")
    .single();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Failed to create organization.");
  }

  if (createAdminUser) {
    const { error: adminInsertError } = await admin.from("admin_users").insert({
      org_id: org.id,
      email,
      role: "admin",
    });
    if (adminInsertError) {
      throw new Error(adminInsertError.message);
    }
  }

  await admin.from("org_branding").insert({
    org_id: org.id,
    public_name: input.companyName,
    sender_name: input.companyName,
    booking_headline: "Book your free consultation",
    referral_headline: `Refer a client to ${input.companyName}`,
  });

  return org;
}
