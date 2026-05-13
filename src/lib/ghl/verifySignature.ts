import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verifies the HMAC-SHA256 signature GHL sends on webhook requests.
 * GHL signs the raw body with the shared secret and sends it in:
 *   x-ghl-signature  (header name may vary — update if GHL uses a different header)
 *
 * Usage at the top of every GHL webhook route:
 *   const { deny, body } = await verifyGhlSignature(req);
 *   if (deny) return deny;
 *   // use `body` as the parsed JSON payload
 */
export async function verifyGhlSignature(
  req: NextRequest
): Promise<{ deny: NextResponse; body: null } | { deny: null; body: Record<string, unknown> }> {
  const secret = process.env.GHL_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[ghl-webhook] GHL_WEBHOOK_SECRET is not set");
    return {
      deny: NextResponse.json({ error: "Server misconfiguration" }, { status: 500 }),
      body: null,
    };
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-ghl-signature") ?? req.headers.get("x-webhook-signature");

  // Log the raw payload so we can verify GHL's actual field names match our extractors.
  // Toggle on by setting GHL_LOG_PAYLOADS=true in env.
  if (process.env.GHL_LOG_PAYLOADS === "true") {
    console.log(`[ghl-webhook] ${req.nextUrl.pathname} raw payload:`, rawBody);
    console.log(`[ghl-webhook] ${req.nextUrl.pathname} headers:`, Object.fromEntries(req.headers.entries()));
  }

  // Auth methods, in order of preference:
  //   1. HMAC signature in x-ghl-signature header (preferred if GHL ever supports it)
  //   2. Shared secret in x-webhook-token header (configured in GHL Workflow custom headers)
  //   3. Shared secret as ?token= query param (fallback)
  //   4. No auth in dev only
  const tokenHeader = req.headers.get("x-webhook-token") ?? req.headers.get("x-ycp-secret");
  const tokenQuery = req.nextUrl.searchParams.get("token");
  const providedToken = tokenHeader ?? tokenQuery;

  if (signature) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(signature, "utf8");

    const signaturesMatch =
      expectedBuf.length === receivedBuf.length &&
      timingSafeEqual(expectedBuf, receivedBuf);

    if (!signaturesMatch) {
      return {
        deny: NextResponse.json({ error: "Invalid signature" }, { status: 403 }),
        body: null,
      };
    }
  } else if (providedToken) {
    // Compare shared secret using timing-safe equality
    const expectedBuf = Buffer.from(secret, "utf8");
    const receivedBuf = Buffer.from(providedToken, "utf8");
    const tokenMatches =
      expectedBuf.length === receivedBuf.length &&
      timingSafeEqual(expectedBuf, receivedBuf);

    if (!tokenMatches) {
      return {
        deny: NextResponse.json({ error: "Invalid token" }, { status: 403 }),
        body: null,
      };
    }
  } else {
    // No auth provided — only allowed in development
    if (process.env.NODE_ENV === "production") {
      return {
        deny: NextResponse.json({ error: "Missing signature or token" }, { status: 403 }),
        body: null,
      };
    }
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return {
      deny: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
      body: null,
    };
  }

  return { deny: null, body };
}
