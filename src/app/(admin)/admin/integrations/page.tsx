import { Webhook } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { INTEGRATION_EVENT_TYPES } from "@/lib/integrations/events";
import { OCG_ORG_ID } from "@/lib/org/context";
import IntegrationsClient from "./IntegrationsClient";

export default async function AdminIntegrationsPage() {
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-50 p-2.5">
          <Webhook className="size-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Integrations</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Configure signed outbound webhooks and monitor integration delivery queues.
          </p>
        </div>
      </div>

      <IntegrationsClient
        initialWebhooks={webhooksResult.data ?? []}
        initialDeliveries={deliveriesResult.data ?? []}
        initialOutbox={outboxResult.data ?? []}
        eventTypes={[...INTEGRATION_EVENT_TYPES]}
      />
    </div>
  );
}

