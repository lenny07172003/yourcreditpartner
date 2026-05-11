import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { markdownToHtml, wrapInLayout } from "@/lib/email/renderTemplate";
import { MONTHLY_DIGEST } from "@/lib/email/partner-templates";
import { loadTiers, getTierForCloses } from "@/lib/commissions/tier-engine";

/**
 * CRON: partner-digest
 * Schedule: 1st of each month at 08:00 UTC
 *
 * Sends a monthly performance recap to all active partners.
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourcreditpartner.com";

  // Previous month
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const closeMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const monthName = prev.toLocaleString("en-US", { month: "long", year: "numeric" });

  const tiers = await loadTiers(admin);

  // Get active partners who haven't received this month's digest
  const { data: partners, error } = await admin
    .from("partners")
    .select("id, email, first_name, last_digest_month, welcome_drip_step")
    .eq("status", "active")
    .is("deleted_at", null)
    .gte("welcome_drip_step", 5);

  if (error || !partners) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  let sent = 0;

  for (const partner of partners) {
    if (partner.last_digest_month === closeMonth) continue;

    // Get their stats for the previous month
    const { data: stats } = await admin
      .from("monthly_partner_stats")
      .select("close_count, current_tier, current_rate, projected_earnings_cents")
      .eq("partner_id", partner.id)
      .eq("close_month", closeMonth)
      .maybeSingle();

    // Get all-time earnings
    const { data: allTimeData } = await admin
      .from("commissions")
      .select("amount_cents")
      .eq("partner_id", partner.id)
      .neq("state", "voided");

    const allTimeEarnings = (allTimeData ?? []).reduce((sum, c) => sum + c.amount_cents, 0);

    const closeCount = stats?.close_count ?? 0;
    const tierInfo = getTierForCloses(tiers, closeCount);
    const nextTier = tiers.find((t) => t.tier_number === tierInfo.tier + 1);

    const subject = MONTHLY_DIGEST.subject(partner.first_name, monthName);
    const bodyMd = MONTHLY_DIGEST.body({
      firstName: partner.first_name,
      month: monthName,
      closeCount,
      tierName: tierInfo.displayName,
      rate: `${(tierInfo.rate * 100).toFixed(0)}%`,
      earningsMtd: `$${((stats?.projected_earnings_cents ?? 0) / 100).toFixed(2)}`,
      earningsAllTime: `$${(allTimeEarnings / 100).toFixed(2)}`,
      closesToNextTier: nextTier ? nextTier.min_closes - closeCount : null,
      nextTierName: nextTier?.display_name ?? null,
    });

    const html = wrapInLayout(
      markdownToHtml(bodyMd),
      `${appUrl}/unsubscribe?partner=${partner.id}`
    );

    const messageId = await sendEmail({
      to: partner.email,
      subject,
      html,
      tags: [{ name: "campaign", value: `digest_${closeMonth}` }],
    });

    if (messageId) {
      await admin
        .from("partners")
        .update({ last_digest_month: closeMonth })
        .eq("id", partner.id);

      await admin.from("email_sends").insert({
        partner_id: partner.id,
        campaign: `digest_${closeMonth}`,
        subject,
        resend_message_id: messageId,
      });
      sent++;
    }
  }

  console.log(`[partner-digest] Sent: ${sent} for ${monthName}`);
  return NextResponse.json({ sent, month: monthName });
}
