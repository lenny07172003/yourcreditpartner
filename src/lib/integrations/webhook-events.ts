import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type InboundWebhookProvider = "ghl" | "twilio" | "stripe" | "cal_com" | "resend";

export async function recordWebhookEvent(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    provider: InboundWebhookProvider;
    externalEventId?: string | null;
    eventType: string;
    payload: Record<string, unknown>;
  }
) {
  const externalEventId =
    input.externalEventId ??
    crypto.createHash("sha256").update(JSON.stringify(input.payload)).digest("hex");

  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      org_id: input.orgId,
      provider: input.provider,
      external_event_id: externalEventId,
      event_type: input.eventType,
      payload: input.payload,
    })
    .select("id")
    .single();

  if (!error) return { id: data.id as string, duplicate: false, externalEventId };
  if (error.code === "23505") return { id: null, duplicate: true, externalEventId };
  throw error;
}

export async function markWebhookEventProcessed(supabase: SupabaseClient, id: string | null) {
  if (!id) return;
  await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", id);
}

