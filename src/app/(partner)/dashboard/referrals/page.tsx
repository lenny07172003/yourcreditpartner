import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnerByAuthId, getPartnerReferrals } from "@/lib/supabase/queries";
import { ReferralsTable } from "./referrals-table";
import { ReferralPipeline } from "./referral-pipeline";

// Map pipeline keys to actual DB stage values
const STAGE_MAP: Record<string, string[]> = {
  submitted: ["submitted"],
  booked: ["booked"],
  consulted: ["consulted"],
  closed: ["closed_won"],
  active_service: ["active_service"],
  paid: ["net_revenue_realized"],
};

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
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
    closed: referrals.filter((r: any) => r.stage === "closed_won").length,
    active_service: referrals.filter((r: any) => r.stage === "active_service").length,
    paid: referrals.filter((r: any) => r.stage === "net_revenue_realized").length,
    refunded: referrals.filter((r: any) => r.stage === "refunded").length,
  };

  // Filter referrals by selected stage
  const params = await searchParams;
  const stageFilter = params.stage;
  const stageValues = stageFilter ? STAGE_MAP[stageFilter] : null;
  const filteredReferrals = stageValues
    ? referrals.filter((r: any) => stageValues.includes(r.stage))
    : referrals;

  const filterLabel = stageFilter
    ? {
        submitted: "Submitted",
        booked: "Booked",
        consulted: "Consulted",
        closed: "Closed",
        active_service: "In Service",
        paid: "Paid",
      }[stageFilter]
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Your Referrals</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {filterLabel
              ? `${filteredReferrals.length} ${filterLabel.toLowerCase()} referral${filteredReferrals.length !== 1 ? "s" : ""}`
              : `${referrals.length} referral${referrals.length !== 1 ? "s" : ""} submitted`}
          </p>
        </div>
        <Link
          href="/dashboard/submit"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          + Submit Referral
        </Link>
      </div>

      <Suspense>
        <ReferralPipeline {...pipeline} total={referrals.length} />
      </Suspense>

      <ReferralsTable data={filteredReferrals} />
    </div>
  );
}
