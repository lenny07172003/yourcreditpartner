import type { SupabaseClient, User } from "@supabase/supabase-js";

export const OCG_ORG_ID = "00000000-0000-4000-8000-000000000001";
export const OCG_ORG_SLUG = "ocg";

export type OrgContext = {
  id: string;
  slug: string;
  name: string;
  calProvider: "in_house" | "ghl" | "cal_com";
};

type OrgRow = {
  id: string;
  slug: string;
  name: string;
  cal_provider: "in_house" | "ghl" | "cal_com";
};

export function getOrgIdFromUser(user: User | null | undefined) {
  const orgId = user?.app_metadata?.org_id;
  return typeof orgId === "string" && orgId.length > 0 ? orgId : OCG_ORG_ID;
}

export async function loadOrgById(
  supabase: SupabaseClient,
  orgId: string = OCG_ORG_ID
): Promise<OrgContext> {
  const { data, error } = await supabase
    .from("orgs")
    .select("id, slug, name, cal_provider")
    .eq("id", orgId)
    .maybeSingle();

  if (error || !data) {
    return { id: OCG_ORG_ID, slug: OCG_ORG_SLUG, name: "Opulent Credit Consulting", calProvider: "in_house" };
  }

  const org = data as OrgRow;
  return { id: org.id, slug: org.slug, name: org.name, calProvider: org.cal_provider };
}

export async function loadOrgBySlug(
  supabase: SupabaseClient,
  slug: string = OCG_ORG_SLUG
): Promise<OrgContext> {
  const { data, error } = await supabase
    .from("orgs")
    .select("id, slug, name, cal_provider")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return { id: OCG_ORG_ID, slug: OCG_ORG_SLUG, name: "Opulent Credit Consulting", calProvider: "in_house" };
  }

  const org = data as OrgRow;
  return { id: org.id, slug: org.slug, name: org.name, calProvider: org.cal_provider };
}

