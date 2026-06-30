import { SupabaseClient } from "@supabase/supabase-js";
import {
  createContact,
  findContactByEmail,
  addContactTags,
  getBookingUrl,
  createOpportunity,
} from "@/lib/ghl/client";

/**
 * Push a referred client to GHL as a contact.
 * Auto-tags with partner-type tag, partner ref tag, and "ycp-referral".
 * If the contact already exists in GHL, we add tags to the existing contact.
 *
 * Called automatically when:
 *  - A partner submits a referral from their dashboard
 *  - A client submits through /refer/[slug] public page
 *
 * Returns the GHL contact ID and the booking URL.
 */
export async function pushReferralToGhl(
  supabase: SupabaseClient,
  referralId: string,
  data: {
    orgId?: string;
    clientFirstName: string;
    clientLastName: string;
    clientEmail: string;
    clientPhone?: string;
    partnerId: string;
    partnerSlug: string;
    partnerType: string;
    partnerFirstName: string;
    partnerLastName: string;
    partnerCompany?: string;
  }
): Promise<{ ghlContactId: string; bookingUrl: string }> {
  // 1. Look up partner type's ghl_tag
  const { data: ptRow } = await supabase
    .from("partner_types")
    .select("ghl_tag")
    .eq("org_id", data.orgId ?? "00000000-0000-4000-8000-000000000001")
    .eq("slug", data.partnerType)
    .single();

  const partnerTypeTag = ptRow?.ghl_tag ?? `partner-type-${data.partnerType}`;
  const partnerRefTag = `ref:${data.partnerSlug}`;

  // Tags applied to every referred client
  const tags = [
    partnerTypeTag,       // e.g. "partner-type-mlo"
    partnerRefTag,        // e.g. "ref:john-smith"
    "ycp-referral",       // universal tag for all YCP referrals
  ];

  // 2. Check if contact already exists in GHL (by email)
  let ghlContactId: string;

  const existing = await findContactByEmail(data.clientEmail);

  if (existing) {
    // Contact exists — just add our tags
    ghlContactId = existing.id;
    await addContactTags(ghlContactId, tags);
  } else {
    // Create new contact with tags
    try {
      const contact = await createContact({
        firstName: data.clientFirstName,
        lastName: data.clientLastName,
        email: data.clientEmail,
        phone: data.clientPhone,
        tags,
        source: `YCP - ${data.partnerFirstName} ${data.partnerLastName}`,
      });
      ghlContactId = contact.id;
    } catch (err: any) {
      // GHL rejects duplicates by email or phone — use the existing contact ID from the error
      if (err.duplicateContactId) {
        ghlContactId = err.duplicateContactId;
        await addContactTags(ghlContactId, tags);
      } else {
        throw err;
      }
    }
  }

  // 3. Create opportunity in the YCP Partner Referrals pipeline
  let ghlOpportunityId: string | null = null;
  const pipelineId = process.env.GHL_PIPELINE_ID;
  const newLeadStageId = process.env.GHL_STAGE_NEW_LEAD;

  if (pipelineId && newLeadStageId) {
    try {
      const opp = await createOpportunity({
        pipelineId,
        pipelineStageId: newLeadStageId,
        contactId: ghlContactId,
        name: `${data.clientFirstName} ${data.clientLastName} — ref:${data.partnerSlug}`,
      });
      ghlOpportunityId = opp.id;
    } catch (err) {
      console.error("[ghl] createOpportunity failed:", err);
      // Don't block referral if pipeline creation fails
    }
  }

  // 4. Save ghl_contact_id and opportunity_id back to the referral
  await supabase
    .from("referrals")
    .update({
      ghl_contact_id: ghlContactId,
      ghl_opportunity_id: ghlOpportunityId,
    })
    .eq("org_id", data.orgId ?? "00000000-0000-4000-8000-000000000001")
    .eq("id", referralId);

  // 5. Return contact ID + booking URL
  const bookingUrl = getBookingUrl();
  return { ghlContactId, bookingUrl };
}

/**
 * Push a new partner to GHL as a contact when they sign up.
 * Auto-creates their ref tag and applies the partner-type tag.
 * This runs automatically during the apply flow.
 */
export async function pushPartnerToGhl(
  supabase: SupabaseClient,
  data: {
    orgId?: string;
    partnerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    partnerSlug: string;
    partnerType: string;
    companyName?: string;
  }
): Promise<string | null> {
  try {
    // Look up partner type's ghl_tag
    const { data: ptRow } = await supabase
      .from("partner_types")
      .select("ghl_tag")
      .eq("org_id", data.orgId ?? "00000000-0000-4000-8000-000000000001")
      .eq("slug", data.partnerType)
      .single();

    const partnerTypeTag = ptRow?.ghl_tag ?? `partner-type-${data.partnerType}`;
    const partnerRefTag = `ref:${data.partnerSlug}`;

    const tags = [
      partnerTypeTag,
      partnerRefTag,
      "ycp-partner",        // distinguishes partners from referred clients
    ];

    // Check if contact exists
    const existing = await findContactByEmail(data.email);

    if (existing) {
      await addContactTags(existing.id, tags);
      return existing.id;
    }

    try {
      const contact = await createContact({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        tags,
        source: "YCP Partner Signup",
      });
      return contact.id;
    } catch (createErr: any) {
      if (createErr.duplicateContactId) {
        await addContactTags(createErr.duplicateContactId, tags);
        return createErr.duplicateContactId;
      }
      throw createErr;
    }
  } catch (err) {
    // Don't block partner signup if GHL is down
    console.error("[ghl] pushPartnerToGhl failed:", err);
    return null;
  }
}
