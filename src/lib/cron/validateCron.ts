import { NextRequest, NextResponse } from "next/server";

/**
 * Validates the cron secret sent by Vercel Cron Jobs.
 * Vercel sends: Authorization: Bearer <CRON_SECRET>
 *
 * Usage at the top of every cron route:
 *   const deny = validateCron(req);
 *   if (deny) return deny;
 */
export function validateCron(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[cron] CRON_SECRET is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
