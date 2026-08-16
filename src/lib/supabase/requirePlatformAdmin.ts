import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Call at the top of every Super Admin (platform-level) API route handler.
 * Returns null if the request is authorized; returns a 401/403 NextResponse if not.
 */
export async function requirePlatformAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: platformAdmin } = await admin
    .from("platform_admins")
    .select("id")
    .eq("email", user.email!.toLowerCase())
    .maybeSingle();

  if (!platformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
