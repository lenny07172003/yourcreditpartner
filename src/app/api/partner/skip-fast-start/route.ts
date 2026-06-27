import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerByAuthId } from "@/lib/supabase/queries";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL!));
  }

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (partner && !partner.fast_start_skipped_at) {
    const admin = createAdminClient();
    await admin
      .from("partners")
      .update({ fast_start_skipped_at: new Date().toISOString() })
      .eq("org_id", partner.org_id)
      .eq("id", partner.id);

    await admin.from("partner_events").insert({
      org_id: partner.org_id,
      partner_id: partner.id,
      actor: "partner",
      event_type: "fast_start_skipped",
      payload: {},
    });
  }

  return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL!));
}
