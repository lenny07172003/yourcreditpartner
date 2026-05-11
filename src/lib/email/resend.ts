import { Resend } from "resend";

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("[email] RESEND_API_KEY is not set");
    resendClient = new Resend(key);
  }
  return resendClient;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "partners@yourcreditpartner.com";
const REPLY_TO = process.env.RESEND_REPLY_TO ?? "lenny@opulentcreditconsulting.com";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

/**
 * Send a single email via Resend.
 * Returns the Resend message ID, or null if sending failed.
 */
export async function sendEmail(input: SendEmailInput): Promise<string | null> {
  try {
    const resend = getClient();
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo ?? REPLY_TO,
      tags: input.tags,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return null;
  }
}

/**
 * Send a batch of emails via Resend (up to 100 per call).
 */
export async function sendBatchEmails(
  emails: SendEmailInput[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const resend = getClient();
  const batch = emails.map((e) => ({
    from: FROM,
    to: e.to,
    subject: e.subject,
    html: e.html,
    replyTo: e.replyTo ?? REPLY_TO,
    tags: e.tags,
  }));

  try {
    const { data, error } = await resend.batch.send(batch);
    if (error) {
      console.error("[email] Batch send error:", error);
      failed = emails.length;
    } else {
      sent = data?.data?.length ?? 0;
      failed = emails.length - sent;
    }
  } catch (err) {
    console.error("[email] Batch send failed:", err);
    failed = emails.length;
  }

  return { sent, failed };
}
