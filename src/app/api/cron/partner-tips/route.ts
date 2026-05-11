import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { markdownToHtml, wrapInLayout } from "@/lib/email/renderTemplate";
import { CREDIT_TIPS } from "@/lib/email/partner-templates";

/**
 * CRON: partner-tips
 * Schedule: bi-weekly (every other Wednesday at 10:00 UTC)
 *
 * Sends shareable credit tips to active partners.
 * Cycles through 12 topics.
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourcreditpartner.com";

  // Active partners who finished welcome series and haven't received a tip in 13+ days
  const { data: partners, error } = await admin
    .from("partners")
    .select("id, email, first_name, last_tip_sent_at, last_tip_index, welcome_drip_step")
    .eq("status", "active")
    .is("deleted_at", null)
    .gte("welcome_drip_step", 5);

  if (error || !partners) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  let sent = 0;

  for (const partner of partners) {
    // Skip if we sent a tip recently
    if (partner.last_tip_sent_at && partner.last_tip_sent_at > fourteenDaysAgo) continue;

    const tipIndex = (partner.last_tip_index ?? 0) % CREDIT_TIPS.length;
    const tip = CREDIT_TIPS[tipIndex];

    const bodyMd = tip.body({ firstName: partner.first_name });
    const html = wrapInLayout(
      markdownToHtml(bodyMd),
      `${appUrl}/unsubscribe?partner=${partner.id}`
    );

    const messageId = await sendEmail({
      to: partner.email,
      subject: tip.subject,
      html,
      tags: [{ name: "campaign", value: `partner_tip_${tipIndex}` }],
    });

    if (messageId) {
      await admin
        .from("partners")
        .update({
          last_tip_sent_at: now.toISOString(),
          last_tip_index: tipIndex + 1,
        })
        .eq("id", partner.id);

      await admin.from("email_sends").insert({
        partner_id: partner.id,
        campaign: `partner_tip_${tipIndex}`,
        subject: tip.subject,
        resend_message_id: messageId,
      });
      sent++;
    }
  }

  console.log(`[partner-tips] Sent: ${sent}`);
  return NextResponse.json({ sent });
}
