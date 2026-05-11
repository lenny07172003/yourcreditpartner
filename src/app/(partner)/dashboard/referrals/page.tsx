import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnerByAuthId, getPartnerReferrals } from "@/lib/supabase/queries";
import { ReferralsTable } from "./referrals-table";
import { ReferralPipeline } from "./referral-pipeline";

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) redirect("/auth/login");

  const referrals = await getPartnerReferrals(supabase, partner.id);

  // Pipeline counts
  const pipeline = {
    submitted: referrals.filter((r: any) => r.stage === "submitted").length,
    booked: referrals.filter((r: any) => r.stage === "booked").length,
    consulted: referrals.filter((r: any) => r.stage === "consulted").length,
    closed: referrals.filter((r: any) =>
      ["closed_won", "active_service", "net_revenue_realized"].includes(r.stage)
    ).length,
    refunded: referrals.filter((r: any) => r.stage === "refunded").length,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Your Referrals</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {referrals.length} referral{referrals.length !== 1 ? "s" : ""} submitted
          </p>
        </div>
        <Link
          href="/dashboard/submit"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          + Submit Referral
        </Link>
      </div>

      <ReferralPipeline {...pipeline} total={referrals.length} />

      <ReferralsTable data={referrals} />
    </div>
  );
}
