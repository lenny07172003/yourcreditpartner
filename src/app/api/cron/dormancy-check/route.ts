import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { wrapInLayout, markdownToHtml } from "@/lib/email/renderTemplate";

/**
 * CRON: dormancy-check
 * Schedule: daily at 09:00 UTC
 *
 * Finds active partners who haven't submitted a referral in 30/60/90 days.
 * Sends escalating re-engagement emails.
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourcreditpartner.com";

  // Find dormant partners
  const { data: partners, error } = await admin
    .from("partners")
    .select("id, email, first_name, last_name, last_submission_at, created_at")
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    console.error("[dormancy-check] Failed to load partners:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!partners || partners.length === 0) {
    return NextResponse.json({ checked: 0, emailed: 0 });
  }

  let emailed = 0;

  for (const partner of partners) {
    const lastActivity = partner.last_submission_at ?? partner.created_at;
    const daysSince = Math.floor(
      (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );

    let subject: string | null = null;
    let bodyMd: string | null = null;

    if (daysSince >= 90) {
      subject = `We miss you, ${partner.first_name}`;
      bodyMd = `Hi ${partner.first_name},\n\nIt's been a while since your last referral. We want to make sure you know we're still here and ready to help your clients.\n\nEvery referral you send earns you a commission — and your clients get expert credit repair.\n\n**[Submit a referral now](${appUrl}/dashboard/submit)**\n\nIf you have questions or need help, just reply to this email.\n\nBest,\nThe Opulent Credit Team`;
    } else if (daysSince >= 60) {
      subject = `Your clients need better credit, ${partner.first_name}`;
      bodyMd = `Hi ${partner.first_name},\n\nIt's been about 60 days since your last referral. Your clients are out there with credit challenges — and you have the solution.\n\nRemember: you earn 15-35% commission on every closed deal. The more you refer, the higher your tier.\n\n**[Submit a referral](${appUrl}/dashboard/submit)**\n\nBest,\nThe Opulent Credit Team`;
    } else if (daysSince >= 30) {
      subject = `Quick check-in, ${partner.first_name}`;
      bodyMd = `Hi ${partner.first_name},\n\nJust a friendly reminder that your partner account is active and ready for referrals.\n\nHave any clients who could use credit repair? It only takes a minute to submit:\n\n**[Submit a referral](${appUrl}/dashboard/submit)**\n\nBest,\nThe Opulent Credit Team`;
    }

    // Only send one email per dormancy threshold per partner
    // Check if we already sent for this threshold
    if (subject && bodyMd) {
      const tag = `dormancy-${daysSince >= 90 ? "90" : daysSince >= 60 ? "60" : "30"}`;

      const { data: alreadySent } = await admin
        .from("email_sends")
        .select("id")
        .eq("partner_id", partner.id)
        .eq("campaign", tag)
        .maybeSingle();

      if (!alreadySent) {
        const html = wrapInLayout(
          markdownToHtml(bodyMd),
          `${appUrl}/unsubscribe?partner=${partner.id}`
        );

        const messageId = await sendEmail({
          to: partner.email,
          subject,
          html,
          tags: [{ name: "campaign", value: tag }],
        });

        if (messageId) {
          await admin.from("email_sends").insert({
            partner_id: partner.id,
            campaign: tag,
            subject,
            resend_message_id: messageId,
          });
          emailed++;
        }
      }
    }
  }

  console.log(`[dormancy-check] Checked: ${partners.length}, Emailed: ${emailed}`);
  return NextResponse.json({ checked: partners.length, emailed });
}
