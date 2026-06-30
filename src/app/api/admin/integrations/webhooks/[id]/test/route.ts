import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fanOutWebhooks } from "@/lib/integrations/dispatch";
import { isIntegrationEventType } from "@/lib/integrations/events";
import { OCG_ORG_ID } from "@/lib/org/context";

export async function POST(_req: Request, ctx: RouteContext<"/api/admin/integrations/webhooks/[id]/test">) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: webhook, error } = await admin
    .from("outbound_webhooks")
    .select("id, events")
    .eq("org_id", OCG_ORG_ID)
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!webhook) return NextResponse.json({ error: "Webhook not found." }, { status: 404 });

  const candidateEvent = webhook.events?.[0];
  const eventType = isIntegrationEventType(candidateEvent) ? candidateEvent : "referral.submitted";
  const result = await fanOutWebhooks(admin, OCG_ORG_ID, eventType, {
    test: true,
    message: "YourCreditPartner webhook test payload",
    webhook_id: id,
  });

  return NextResponse.json(result);
}
