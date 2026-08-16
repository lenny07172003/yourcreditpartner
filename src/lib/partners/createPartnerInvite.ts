import type { SupabaseClient } from "@supabase/supabase-js";

export type CreatePartnerInviteInput = {
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  partnerType: string;
};

function generateSlug(firstName: string, lastName: string): string {
  const base = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}

export class SeatLimitExceededError extends Error {
  constructor(public used: number, public limit: number) {
    super(`Partner seat limit reached (${used}/${limit}). Purchase additional seats to add more partners.`);
    this.name = "SeatLimitExceededError";
  }
}

/**
 * Admin-initiated partner creation (Company Admin or Super Admin), as opposed
 * to the self-serve /apply flow. The invited partner still has to complete
 * the affiliate agreement themselves on first login — agreement_signed_at is
 * left null here — so the document's clickwrap/PDF/IP-capture flow isn't
 * bypassed just because an admin did the inviting.
 *
 * Enforces the org's partner seat limit (included_partner_slots +
 * purchased_additional_slots) before creating the row.
 */
export async function createPartnerInvite(admin: SupabaseClient, input: CreatePartnerInviteInput) {
  const email = input.email.toLowerCase();

  const { data: org } = await admin
    .from("orgs")
    .select("included_partner_slots, purchased_additional_slots")
    .eq("id", input.orgId)
    .single();

  if (org) {
    const { count } = await admin
      .from("partners")
      .select("id", { count: "exact", head: true })
      .eq("org_id", input.orgId)
      .neq("status", "terminated");

    const limit = org.included_partner_slots + org.purchased_additional_slots;
    const used = count ?? 0;
    if (used >= limit) {
      throw new SeatLimitExceededError(used, limit);
    }
  }

  const { data: existing } = await admin
    .from("partners")
    .select("id")
    .eq("org_id", input.orgId)
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    throw new Error("A partner with this email already exists in this organization.");
  }

  const { data: partner, error } = await admin
    .from("partners")
    .insert({
      org_id: input.orgId,
      email,
      phone: input.phone,
      first_name: input.firstName,
      last_name: input.lastName,
      partner_type: input.partnerType,
      partner_slug: generateSlug(input.firstName, input.lastName),
      status: "active",
    })
    .select("id, org_id, email")
    .single();

  if (error || !partner) {
    throw new Error(error?.message ?? "Failed to create partner.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback`,
  });

  return partner;
}
