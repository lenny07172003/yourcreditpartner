import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerByAuthId } from "@/lib/supabase/queries";
import { CheckCircle, LinkIcon, ClipboardList, DollarSign } from "lucide-react";

export default async function OnboardingCompletePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) redirect("/auth/login");

  // Mark fast_start_completed if not already set
  if (!partner.fast_start_completed_at) {
    const admin = createAdminClient();
    await admin
      .from("partners")
      .update({ fast_start_completed_at: new Date().toISOString() })
      .eq("org_id", partner.org_id)
      .eq("id", partner.id);

    await admin.from("partner_events").insert({
      org_id: partner.org_id,
      partner_id: partner.id,
      actor: "system",
      event_type: "fast_start_completed",
      payload: {},
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-md text-center">
        {/* Celebration */}
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-500">
          <CheckCircle className="size-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white">
          You&rsquo;re all set, {partner.first_name}!
        </h1>

        <p className="mt-3 text-base text-brand-400">
          Fast Start complete. Your partner dashboard is ready — start referring
          clients and earning commissions.
        </p>

        {/* Key info */}
        <div className="mt-8 space-y-3 rounded-2xl border border-brand-800 bg-brand-900 p-6 text-left">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-brand-800 p-2">
              <LinkIcon className="size-4 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Your referral link</p>
              <p className="text-xs text-brand-400">
                yourcreditpartner.com/refer/{partner.partner_slug}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-brand-800 p-2">
              <ClipboardList className="size-4 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Submit a referral</p>
              <p className="text-xs text-brand-400">
                Share your link or submit directly from your dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-brand-800 p-2">
              <DollarSign className="size-4 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Get paid monthly</p>
              <p className="text-xs text-brand-400">
                Commissions pay out via Zelle after the 30-day refund window.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="mt-8 block w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          Go to my dashboard →
        </Link>
      </div>
    </div>
  );
}
