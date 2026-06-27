import type { SupabaseClient } from "@supabase/supabase-js";
import { OCG_ORG_ID } from "@/lib/org/context";

export type OrgBranding = {
  org_id: string;
  public_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  support_email: string | null;
  sender_name: string;
  sender_email: string | null;
  reply_to_email: string | null;
  booking_headline: string;
  referral_headline: string;
};

export const defaultBranding: OrgBranding = {
  org_id: OCG_ORG_ID,
  public_name: "Opulent Credit Consulting",
  logo_url: null,
  favicon_url: null,
  primary_color: "#4F46E5",
  accent_color: "#7C3AED",
  support_email: null,
  sender_name: "YourCreditPartner",
  sender_email: null,
  reply_to_email: null,
  booking_headline: "Book your free credit consultation",
  referral_headline: "Refer a client to Opulent Credit Consulting",
};

export async function loadBranding(
  supabase: SupabaseClient,
  orgId: string = OCG_ORG_ID
): Promise<OrgBranding> {
  const { data, error } = await supabase
    .from("org_branding")
    .select("org_id, public_name, logo_url, favicon_url, primary_color, accent_color, support_email, sender_name, sender_email, reply_to_email, booking_headline, referral_headline")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data) return defaultBranding;
  return { ...defaultBranding, ...(data as OrgBranding) };
}

