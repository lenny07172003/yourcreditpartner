import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Checks a fixed-window rate limit for the caller's IP on a given route.
 * Fails open (allows the request) if the rate-limit check itself errors,
 * so an infra hiccup never takes down public endpoints.
 */
export async function checkRateLimit(
  req: NextRequest,
  routeName: string,
  opts: { windowSeconds: number; max: number }
): Promise<boolean> {
  const key = `${routeName}:${clientIp(req)}`;
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: opts.windowSeconds,
    p_max: opts.max,
  });

  if (error) {
    console.error("[rate-limit] check failed, allowing request:", error);
    return true;
  }

  return data as boolean;
}

/**
 * Convenience wrapper for route handlers — returns a 429 NextResponse if the
 * caller is over the limit, or null if the request should proceed.
 *
 * Usage at the top of a public route handler:
 *   const limited = await rateLimitOrDeny(req, "apply", { windowSeconds: 60, max: 5 });
 *   if (limited) return limited;
 */
export async function rateLimitOrDeny(
  req: NextRequest,
  routeName: string,
  opts: { windowSeconds: number; max: number }
): Promise<NextResponse | null> {
  const allowed = await checkRateLimit(req, routeName, opts);
  if (allowed) return null;
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429 }
  );
}
