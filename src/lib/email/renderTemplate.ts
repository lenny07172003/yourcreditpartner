import { getBookingUrl } from "@/lib/ghl/client";

/**
 * Template variable map for client nurture emails.
 * All variables in templates use {variable_name} syntax.
 */
export interface NurtureVariables {
  first_name: string;
  last_name: string;
  partner_first_name: string;
  partner_last_name: string;
  partner_company: string;
  calendar_link: string;
  rebook_link: string;
  consult_time?: string;
  unsubscribe_link: string;
}

/**
 * Build the variable map for a client nurture email.
 */
export function buildNurtureVariables(data: {
  clientFirstName: string;
  clientLastName: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerCompany?: string;
  consultTime?: string;
  referralId: string;
}): NurtureVariables {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourcreditpartner.com";
  const bookingUrl = getBookingUrl();

  return {
    first_name: data.clientFirstName,
    last_name: data.clientLastName,
    partner_first_name: data.partnerFirstName,
    partner_last_name: data.partnerLastName,
    partner_company: data.partnerCompany ?? "our partner",
    calendar_link: bookingUrl,
    rebook_link: bookingUrl,
    consult_time: data.consultTime ?? "",
    unsubscribe_link: `${appUrl}/unsubscribe?ref=${data.referralId}`,
  };
}

/**
 * Interpolate {variable_name} placeholders in a template string.
 */
export function interpolate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

/**
 * Convert markdown-ish email body to simple HTML.
 * Handles: **bold**, [link text](url), newlines → <br>
 * Links render as premium CTA buttons when on their own line.
 */
export function markdownToHtml(md: string): string {
  let html = md
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1e293b;">$1</strong>')
    // Standalone links (full line) → CTA buttons
    .replace(
      /(?:^|\n)\[(.+?)\]\((.+?)\)(?:\n|$)/g,
      `</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td align="center">
            <a href="$2" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">$1</a>
          </td>
        </tr>
      </table>
      <p>`
    )
    // Inline links (within text)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:underline;font-weight:500;">$1</a>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p style="margin:0 0 16px 0;">')
    // Single newlines → <br>
    .replace(/\n/g, "<br>");

  // Handle list items (lines starting with -)
  html = html.replace(
    /(?:^|<br>)- (.+?)(?=<br>|<\/p>|$)/g,
    '<li style="margin:6px 0;padding-left:4px;">$1</li>'
  );
  html = html.replace(
    /(<li[^>]*>.*?<\/li>)+/g,
    '<ul style="margin:12px 0;padding-left:20px;list-style:none;">$&</ul>'
  );
  // Add custom bullet
  html = html.replace(
    /<li style="/g,
    '<li style="position:relative;padding-left:16px;'
  );

  // Handle numbered items
  html = html.replace(
    /(?:^|<br>)(\d+)\.\s(.+?)(?=<br>|<\/p>|$)/g,
    '<li style="margin:6px 0;"><span style="color:#2563eb;font-weight:600;">$1.</span> $2</li>'
  );

  return `<p style="margin:0 0 16px 0;">${html}</p>`;
}

/**
 * Wrap email body HTML in a premium fintech-style layout.
 * Design: Blue/purple gradient header, white body, subtle gray footer.
 * Branding: YourCreditPartner (white-label ready).
 */
export function wrapInLayout(bodyHtml: string, unsubscribeLink: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Logo Header -->
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#1e293b;">Your<span style="color:#2563eb;">Credit</span>Partner</span>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

                <!-- Gradient Accent Bar -->
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#2563eb,#7c3aed,#2563eb);font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td style="padding:40px 36px;color:#334155;font-size:15px;line-height:1.7;">
                    ${bodyHtml}
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 36px;">
                    <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);"></div>
                  </td>
                </tr>

                <!-- Footer inside card -->
                <tr>
                  <td style="padding:24px 36px 28px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#64748b;font-weight:500;">
                      Powered by <span style="color:#1e293b;font-weight:600;">Opulent Credit Consulting</span>
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">
                      Helping professionals earn more through credit repair referrals
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Links -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;font-size:11px;color:#94a3b8;">
              <a href="https://yourcreditpartner.com" style="color:#64748b;text-decoration:none;font-weight:500;">yourcreditpartner.com</a>
              <span style="margin:0 8px;color:#cbd5e1;">&middot;</span>
              <a href="${unsubscribeLink}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Full pipeline: take a markdown template + variables → produce ready-to-send HTML email.
 */
export function renderNurtureEmail(
  bodyMarkdown: string,
  subjectTemplate: string,
  variables: NurtureVariables
): { subject: string; html: string } {
  const vars = variables as unknown as Record<string, string>;
  const subject = interpolate(subjectTemplate, vars);
  const bodyInterpolated = interpolate(bodyMarkdown, vars);
  const bodyHtml = markdownToHtml(bodyInterpolated);
  const html = wrapInLayout(bodyHtml, variables.unsubscribe_link);

  return { subject, html };
}
