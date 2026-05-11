import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadTiers, getTierForCloses } from "@/lib/commissions/tier-engine";
import { sendEmail } from "@/lib/email/resend";
import { wrapInLayout, markdownToHtml } from "@/lib/email/renderTemplate";

/**
 * CRON: tier-threshold-alerts
 * Schedule: daily at 10:00 UTC
 *
 * Notifies partners who are close to reaching the next tier
 * (within 2 closes of the threshold).
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const tiers = await loadTiers(admin);
  const now = new Date();
  const closeMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourcreditpartner.com";

  // Get all partner stats for this month
  const { data: stats, error } = await admin
    .from("monthly_partner_stats")
    .select("partner_id, close_count, current_tier")
    .eq("close_month", closeMonth)
    .eq("finalized", false);

  if (error || !stats) {
    return NextResponse.json({ notified: 0 });
  }

  let notified = 0;

  for (const stat of stats) {
    const currentTier = getTierForCloses(tiers, stat.close_count);
    const nextTier = tiers.find((t) => t.tier_number === currentTier.tier + 1);

    if (!nextTier) continue; // Already at max tier

    const closesNeeded = nextTier.min_closes - stat.close_count;
    if (closesNeeded > 2 || closesNeeded <= 0) continue; // Not close enough

    // Check if we already sent this alert this month
    const alertTag = `tier-alert-${closeMonth}-${nextTier.tier_number}`;
    const { data: alreadySent } = await admin
      .from("email_sends")
      .select("id")
      .eq("partner_id", stat.partner_id)
      .eq("campaign", alertTag)
      .maybeSingle();

    if (alreadySent) continue;

    // Get partner info
    const { data: partner } = await admin
      .from("partners")
      .select("email, first_name")
      .eq("id", stat.partner_id)
      .single();

    if (!partner) continue;

    const subject = `${partner.first_name}, you're ${closesNeeded} close${closesNeeded === 1 ? "" : "s"} from ${nextTier.display_name}!`;
    const bodyMd = `Hi ${partner.first_name},\n\nYou're **so close** to reaching **${nextTier.display_name}** tier this month!\n\nYou have **${stat.close_count} closes** — just **${closesNeeded} more** and your commission rate jumps to **${(nextTier.rate * 100).toFixed(0)}%** on ALL closes this month (retroactive).\n\n**[Submit a referral now](${appUrl}/dashboard/submit)**\n\nKeep going!\nThe Opulent Credit Team`;

    const html = wrapInLayout(
      markdownToHtml(bodyMd),
      `${appUrl}/unsubscribe?partner=${stat.partner_id}`
    );

    const messageId = await sendEmail({
      to: partner.email,
      subject,
      html,
      tags: [{ name: "campaign", value: alertTag }],
    });

    if (messageId) {
      await admin.from("email_sends").insert({
        partner_id: stat.partner_id,
        campaign: alertTag,
        subject,
        resend_message_id: messageId,
      });
      notified++;
    }
  }

  console.log(`[tier-threshold-alerts] Notified: ${notified}`);
  return NextResponse.json({ notified });
}
