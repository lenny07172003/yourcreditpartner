import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { OCG_ORG_ID } from "@/lib/org/context";

export async function POST(_req: Request, ctx: RouteContext<"/api/admin/integrations/webhook-deliveries/[id]/retry">) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await ctx.params;
  const { error } = await createAdminClient()
    .from("webhook_deliveries")
    .update({
      status: "pending",
      next_attempt_at: new Date().toISOString(),
      error_message: null,
      completed_at: null,
    })
    .eq("org_id", OCG_ORG_ID)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

