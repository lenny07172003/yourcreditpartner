import { NextRequest, NextResponse } from "next/server";
import { validateCron } from "@/lib/cron/validateCron";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDueIntegrationOutbox } from "@/lib/integrations/outbox";
import { processDueWebhookDeliveries } from "@/lib/integrations/dispatch";

async function process(req: NextRequest) {
  const deny = validateCron(req);
  if (deny) return deny;

  const admin = createAdminClient();
  const [webhooks, integrations] = await Promise.all([
    processDueWebhookDeliveries(admin, 100),
    processDueIntegrationOutbox(admin, 100),
  ]);

  return NextResponse.json({
    processedAt: new Date().toISOString(),
    webhooks,
    integrations,
  });
}

export async function GET(req: NextRequest) {
  return process(req);
}

export async function POST(req: NextRequest) {
  return process(req);
}

