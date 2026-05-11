import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnerByAuthId } from "@/lib/supabase/queries";
import CopyButton from "./CopyButton";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) redirect("/auth/login");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourcreditpartner.com";
  const referralLink = `${appUrl}/refer/${partner.partner_slug}`;
  const partnerInviteLink = `${appUrl}/apply?ref=${partner.partner_slug}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Resources</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Everything you need to start referring clients
        </p>
      </div>

      {/* Referral Link */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Your Referral Link</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Share this with anyone who needs credit repair. They&rsquo;ll fill in their own info and the referral is automatically attributed to you.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink"
          />
          <CopyButton text={referralLink} />
        </div>
      </div>

      {/* Partner Invite Link */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6">
        <h2 className="text-sm font-semibold text-brand-900">Invite a Partner</h2>
        <p className="mt-1 text-xs text-brand-700">
          Know a colleague who&rsquo;d benefit? Share this link — when they sign up and earn commissions, you earn 5% of everything they make.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={partnerInviteLink}
            className="flex-1 rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-ink"
          />
          <CopyButton text={partnerInviteLink} />
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">How It Works</h2>
        <div className="mt-4 space-y-4">
          {[
            {
              step: "1",
              title: "Refer a Client",
              desc: "Submit their info through your dashboard or share your referral link.",
            },
            {
              step: "2",
              title: "We Handle Everything",
              desc: "We reach out, schedule a free consultation, and manage the credit repair process.",
            },
            {
              step: "3",
              title: "You Earn a Commission",
              desc: "When the client signs up, you earn 15-35% commission based on your tier.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex size-8 flex-none items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{item.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Tiers */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Commission Tiers</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5">Tier</th>
                <th className="px-4 py-2.5">Closes/Month</th>
                <th className="px-4 py-2.5">Rate</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Starter", closes: "1-9", rate: "15%" },
                { name: "Producer", closes: "10-24", rate: "20%" },
                { name: "Top Tier", closes: "25-39", rate: "25%" },
                { name: "Elite", closes: "40+", rate: "35%" },
              ].map((tier) => (
                <tr key={tier.name} className="border-t border-line">
                  <td className="px-4 py-2.5 text-sm font-medium text-ink">{tier.name}</td>
                  <td className="px-4 py-2.5 text-sm text-ink-muted">{tier.closes}</td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-brand-600">{tier.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Tiers are retroactive — when you cross a threshold, all closes that month recalculate at the higher rate.
        </p>
      </div>
    </div>
  );
}
