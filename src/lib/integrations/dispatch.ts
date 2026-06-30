import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntegrationEventType } from "@/lib/integrations/events";

const BACKOFF_MINUTES = [1, 5, 30, 120, 720, 1440];
const MAX_RESPONSE_BODY_CHARS = 4000;

type OrgRow = { id: string; slug: string };
type OutboundWebhook = {
  id: string;
  org_id: string;
  name: string;
  url: string;
  secret: string;
  retry_policy: { max_attempts?: number } | null;
};
type WebhookDelivery = {
  id: string;
  org_id: string;
  webhook_id: string;
  event_type: string;
  event_id: string;
  payload: Record<string, unknown>;
  attempt_number: number;
  max_attempts: number;
  outbound_webhooks: Pick<OutboundWebhook, "url" | "secret"> | Pick<OutboundWebhook, "url" | "secret">[] | null;
  orgs: Pick<OrgRow, "slug"> | Pick<OrgRow, "slug">[] | null;
};

function single<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function nextRetryAt(attemptNumber: number) {
  const minutes = BACKOFF_MINUTES[Math.max(0, Math.min(attemptNumber - 1, BACKOFF_MINUTES.length - 1))];
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function signWebhookPayload(body: string, secret: string) {
  return `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
}

async function loadOrgSlug(supabase: SupabaseClient, orgId: string) {
  const { data } = await supabase.from("orgs").select("slug").eq("id", orgId).maybeSingle();
  return (data as OrgRow | null)?.slug ?? "ocg";
}

export async function fanOutWebhooks(
  supabase: SupabaseClient,
  orgId: string,
  eventType: IntegrationEventType,
  data: Record<string, unknown>,
  options: { eventId?: string; occurredAt?: string } = {}
) {
  const { data: webhooks, error } = await supabase
    .from("outbound_webhooks")
    .select("id, org_id, name, url, secret, retry_policy")
    .eq("org_id", orgId)
    .eq("active", true)
    .contains("events", [eventType]);

  if (error) throw error;
  if (!webhooks?.length) return { eventId: options.eventId ?? crypto.randomUUID(), queued: 0 };

  const eventId = options.eventId ?? crypto.randomUUID();
  const orgSlug = await loadOrgSlug(supabase, orgId);
  const occurredAt = options.occurredAt ?? new Date().toISOString();

  const rows = (webhooks as OutboundWebhook[]).map((webhook) => {
    const maxAttempts = Math.max(1, Math.min(Number(webhook.retry_policy?.max_attempts ?? 6), 12));
    return {
      org_id: orgId,
      webhook_id: webhook.id,
      event_type: eventType,
      event_id: eventId,
      max_attempts: maxAttempts,
      next_attempt_at: new Date().toISOString(),
      status: "pending",
      payload: {
        event: eventType,
        event_id: eventId,
        org: orgSlug,
        occurred_at: occurredAt,
        data,
      },
    };
  });

  const { error: insertError } = await supabase.from("webhook_deliveries").insert(rows);
  if (insertError) throw insertError;
  return { eventId, queued: rows.length };
}

async function markDeliveryFailure(
  supabase: SupabaseClient,
  delivery: WebhookDelivery,
  update: { responseCode?: number; responseBody?: string; errorMessage?: string }
) {
  const finalAttempt = delivery.attempt_number >= delivery.max_attempts;
  const status = finalAttempt ? "dead_lettered" : "failed";
  const patch: Record<string, unknown> = {
    status,
    response_code: update.responseCode ?? null,
    response_body: update.responseBody?.slice(0, MAX_RESPONSE_BODY_CHARS) ?? null,
    error_message: update.errorMessage?.slice(0, 1000) ?? null,
    last_attempt_at: new Date().toISOString(),
  };

  if (finalAttempt) {
    patch.completed_at = new Date().toISOString();
  } else {
    patch.attempt_number = delivery.attempt_number + 1;
    patch.next_attempt_at = nextRetryAt(delivery.attempt_number);
  }

  await supabase.from("webhook_deliveries").update(patch).eq("id", delivery.id);
}

export async function deliverWebhookDelivery(supabase: SupabaseClient, delivery: WebhookDelivery) {
  const webhook = single(delivery.outbound_webhooks);
  const org = single(delivery.orgs);
  if (!webhook) {
    await markDeliveryFailure(supabase, delivery, { errorMessage: "Webhook configuration not found." });
    return false;
  }

  await supabase
    .from("webhook_deliveries")
    .update({ status: "processing", last_attempt_at: new Date().toISOString() })
    .eq("id", delivery.id);

  const body = JSON.stringify(delivery.payload);
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-YCP-Signature": signWebhookPayload(body, webhook.secret),
        "X-YCP-Event": delivery.event_type,
        "X-YCP-Event-Id": delivery.event_id,
        "X-YCP-Delivery-Id": delivery.id,
        "X-YCP-Org": org?.slug ?? "ocg",
      },
      body,
    });
    const responseBody = await response.text();

    if (response.ok) {
      await supabase
        .from("webhook_deliveries")
        .update({
          status: "succeeded",
          response_code: response.status,
          response_body: responseBody.slice(0, MAX_RESPONSE_BODY_CHARS),
          error_message: null,
          completed_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);
      return true;
    }

    await markDeliveryFailure(supabase, delivery, {
      responseCode: response.status,
      responseBody,
      errorMessage: `HTTP ${response.status}`,
    });
    return false;
  } catch (error) {
    await markDeliveryFailure(supabase, delivery, {
      errorMessage: error instanceof Error ? error.message : "Unknown delivery error",
    });
    return false;
  }
}

export async function processDueWebhookDeliveries(supabase: SupabaseClient, limit = 100) {
  const { data, error } = await supabase
    .from("webhook_deliveries")
    .select("*, outbound_webhooks!inner(url, secret), orgs!inner(slug)")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  let succeeded = 0;
  let failed = 0;
  for (const delivery of (data ?? []) as WebhookDelivery[]) {
    const ok = await deliverWebhookDelivery(supabase, delivery);
    if (ok) succeeded++;
    else failed++;
  }

  return { processed: data?.length ?? 0, succeeded, failed };
}

