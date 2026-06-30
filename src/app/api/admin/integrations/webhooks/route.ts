import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { INTEGRATION_EVENT_TYPES } from "@/lib/integrations/events";
import { OCG_ORG_ID } from "@/lib/org/context";

const webhookSchema = z.object({
  name: z.string().trim().min(2).max(120),
  url: z.string().url().refine((value) => value.startsWith("http://") || value.startsWith("https://"), "URL must start with http:// or https://"),
  events: z.array(z.enum(INTEGRATION_EVENT_TYPES)).min(1),
  active: z.boolean().default(true),
});

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const admin = createAdminClient();
  const [webhooksResult, deliveriesResult, outboxResult] = await Promise.all([
    admin
      .from("outbound_webhooks")
      .select("id, name, url, events, active, created_at, updated_at")
      .eq("org_id", OCG_ORG_ID)
      .order("created_at", { ascending: false }),
    admin
      .from("webhook_deliveries")
      .select("id, webhook_id, event_type, event_id, status, attempt_number, response_code, error_message, created_at, completed_at")
      .eq("org_id", OCG_ORG_ID)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("integration_outbox")
      .select("id, provider, job_type, aggregate_type, aggregate_id, status, attempt_number, error_message, created_at, completed_at")
      .eq("org_id", OCG_ORG_ID)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (webhooksResult.error) return NextResponse.json({ error: webhooksResult.error.message }, { status: 500 });
  if (deliveriesResult.error) return NextResponse.json({ error: deliveriesResult.error.message }, { status: 500 });
  if (outboxResult.error) return NextResponse.json({ error: outboxResult.error.message }, { status: 500 });

  return NextResponse.json({
    webhooks: webhooksResult.data ?? [],
    deliveries: deliveriesResult.data ?? [],
    integrationOutbox: outboxResult.data ?? [],
    eventTypes: INTEGRATION_EVENT_TYPES,
  });
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const parsed = webhookSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid webhook configuration.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from("outbound_webhooks")
    .insert({
      org_id: OCG_ORG_ID,
      name: parsed.data.name,
      url: parsed.data.url,
      events: parsed.data.events,
      active: parsed.data.active,
    })
    .select("id, secret")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, secret: data.secret }, { status: 201 });
}
