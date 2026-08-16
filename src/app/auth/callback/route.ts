import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { OCG_ORG_ID } from "@/lib/org/context";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_code", req.url));
  }

  // Collected here instead of writing through next/headers' cookies(),
  // then attached directly to whichever NextResponse we end up returning —
  // cookies set via cookies().set() are not reliably carried over when a
  // fresh NextResponse.redirect() is constructed afterward.
  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];

  // User client — only used to exchange the code for a session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  function redirect(url: string | URL) {
    const res = NextResponse.redirect(url instanceof URL ? url : new URL(url, req.url));
    pendingCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("[callback] exchange error:", error);
    return redirect("/auth/login?error=invalid_link");
  }

  const { user } = data.session;

  // Admin client bypasses RLS — needed because partner.auth_user_id is NULL
  // at first login and the RLS policy blocks the user client from seeing the row
  const admin = createAdminClient();

  // Resolve org_id from whichever role table this email belongs to —
  // not scoped to OCG, since other tenants' partners/admins log in through
  // this same callback.
  const { data: partner } = await admin
    .from("partners")
    .select("id, org_id, auth_user_id, fast_start_completed_at, fast_start_skipped_at, agreement_signed_at")
    .eq("email", user.email!.toLowerCase())
    .maybeSingle();

  if (partner && !partner.auth_user_id) {
    await admin
      .from("partners")
      .update({ auth_user_id: user.id })
      .eq("id", partner.id);
  }

  // Check if partner is an admin instead
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("id, org_id, role")
    .eq("email", user.email!.toLowerCase())
    .maybeSingle();

  // Or a platform-level (Super Admin) user, not tied to any single org
  const { data: platformAdmin } = await admin
    .from("platform_admins")
    .select("id")
    .eq("email", user.email!.toLowerCase())
    .maybeSingle();

  const orgId = partner?.org_id ?? adminUser?.org_id ?? OCG_ORG_ID;
  if (user.app_metadata?.org_id !== orgId) {
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, org_id: orgId },
    });
  }

  if ((adminUser || platformAdmin) && !partner) {
    return redirect("/admin");
  }

  // Admin-invited partners haven't signed the affiliate agreement yet
  // (self-serve /apply captures it before the partner row even exists) —
  // send them there first, before password setup or Fast Start.
  if (partner && !partner.agreement_signed_at) {
    const agreementUrl = new URL("/onboarding/agreement", req.url);
    agreementUrl.searchParams.set("next", next);
    return redirect(agreementUrl);
  }

  // Determine where to send the partner after password setup
  const afterPassword =
    partner && !partner.fast_start_completed_at && !partner.fast_start_skipped_at
      ? "/onboarding/fast-start"
      : next;

  // First-time login: no password set yet → prompt to set one
  // We detect this via the `type` param Supabase adds to magic links
  const linkType = searchParams.get("type");
  const isFirstLogin = linkType === "magiclink" || linkType === "signup" || !linkType;

  if (partner && isFirstLogin) {
    const pwUrl = new URL("/auth/set-password", req.url);
    pwUrl.searchParams.set("next", afterPassword);
    return redirect(pwUrl);
  }

  return redirect(afterPassword);
}
