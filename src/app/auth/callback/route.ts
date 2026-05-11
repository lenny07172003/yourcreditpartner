import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_code", req.url));
  }

  const cookieStore = await cookies();

  // User client — only used to exchange the code for a session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("[callback] exchange error:", error);
    return NextResponse.redirect(new URL("/auth/login?error=invalid_link", req.url));
  }

  const { user } = data.session;

  // Admin client bypasses RLS — needed because partner.auth_user_id is NULL
  // at first login and the RLS policy blocks the user client from seeing the row
  const admin = createAdminClient();

  const { data: partner } = await admin
    .from("partners")
    .select("id, auth_user_id, fast_start_completed_at, fast_start_skipped_at")
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
    .select("id, role")
    .eq("email", user.email!.toLowerCase())
    .maybeSingle();

  if (adminUser && !partner) {
    return NextResponse.redirect(new URL("/admin", req.url));
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
    return NextResponse.redirect(pwUrl);
  }

  return NextResponse.redirect(new URL(afterPassword, req.url));
}
