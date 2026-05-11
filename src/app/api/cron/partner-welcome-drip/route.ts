import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { markdownToHtml, wrapInLayout } from "@/lib/email/renderTemplate";
import { WELCOME_SERIES, REFER_A_PARTNER } from "@/lib/email/partner-templates";

/**
 * CRON: partner-welcome-drip
 * Schedule: daily at 08:00 UTC
 *
 * Sends the next welcome email to partners based on days since signup.
 * Also sends refer-a-partner at day 14.
 */
export async function GET(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourcreditpartner.com";

  // Get partners who haven't finished the welcome series (step < 5)
  const { data: partners, error } = await admin
    .from("partners")
    .select("id, email, first_name, last_name, partner_slug, created_at, welcome_drip_step")
    .eq("status", "active")
    .is("deleted_at", null)
    .lt("welcome_drip_step", 6); // 0-4 = welcome, 5 = refer-a-partner

  if (error || !partners) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  let sent = 0;

  for (const partner of partners) {
    const daysSinceSignup = Math.floor(
      (now.getTime() - new Date(partner.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Find the next welcome email that should be sent
    const nextStep = WELCOME_SERIES.find(
      (s) => s.step === partner.welcome_drip_step && daysSinceSignup >= s.dayOffset
    );

    if (nextStep) {
      const subject = nextStep.subject(partner.first_name);
      const bodyMd = nextStep.body({
        firstName: partner.first_name,
        partnerSlug: partner.partner_slug,
      });
      const html = wrapInLayout(
        markdownToHtml(bodyMd),
        `${appUrl}/unsubscribe?partner=${partner.id}`
      );

      const messageId = await sendEmail({
        to: partner.email,
        subject,
        html,
        tags: [{ name: "campaign", value: `welcome_d${nextStep.dayOffset}` }],
      });

      if (messageId) {
        await admin
          .from("partners")
          .update({ welcome_drip_step: partner.welcome_drip_step + 1 })
          .eq("id", partner.id);

        await admin.from("email_sends").insert({
          partner_id: partner.id,
          campaign: `welcome_d${nextStep.dayOffset}`,
          subject,
          resend_message_id: messageId,
        });
        sent++;
      }
    }

    // Send refer-a-partner at day 14 (step 5)
    if (partner.welcome_drip_step === 5 && daysSinceSignup >= 14) {
      const subject = REFER_A_PARTNER.subject(partner.first_name);
      const bodyMd = REFER_A_PARTNER.body({
        firstName: partner.first_name,
        partnerSlug: partner.partner_slug,
      });
      const html = wrapInLayout(
        markdownToHtml(bodyMd),
        `${appUrl}/unsubscribe?partner=${partner.id}`
      );

      const messageId = await sendEmail({
        to: partner.email,
        subject,
        html,
        tags: [{ name: "campaign", value: "refer_a_partner" }],
      });

      if (messageId) {
        await admin
          .from("partners")
          .update({ welcome_drip_step: 6 })
          .eq("id", partner.id);

        await admin.from("email_sends").insert({
          partner_id: partner.id,
          campaign: "refer_a_partner",
          subject,
          resend_message_id: messageId,
        });
        sent++;
      }
    }
  }

  console.log(`[partner-welcome-drip] Sent: ${sent}`);
  return NextResponse.json({ sent });
}
