"use client";

import { useState } from "react";
import { toast } from "sonner";

type OutboundWebhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

type WebhookDelivery = {
  id: string;
  webhook_id: string;
  event_type: string;
  event_id: string;
  status: string;
  attempt_number: number;
  response_code: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

type IntegrationOutboxItem = {
  id: string;
  provider: string;
  job_type: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  status: string;
  attempt_number: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

type Props = {
  initialWebhooks: OutboundWebhook[];
  initialDeliveries: WebhookDelivery[];
  initialOutbox: IntegrationOutboxItem[];
  eventTypes: string[];
};

function statusClass(status: string) {
  if (status === "succeeded") return "bg-success/10 text-success";
  if (status === "dead_lettered" || status === "failed") return "bg-danger/10 text-danger";
  if (status === "processing") return "bg-warning/10 text-warning";
  return "bg-surface-raised text-ink-muted";
}

export default function IntegrationsClient({ initialWebhooks, initialDeliveries, initialOutbox, eventTypes }: Props) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [outbox, setOutbox] = useState(initialOutbox);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["referral.submitted"]);
  const [saving, setSaving] = useState(false);
  const [lastSecret, setLastSecret] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/integrations/webhooks");
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Could not refresh integrations.");
    setWebhooks(data.webhooks ?? []);
    setDeliveries(data.deliveries ?? []);
    setOutbox(data.integrationOutbox ?? []);
  }

  async function createWebhook() {
    setSaving(true);
    const res = await fetch("/api/admin/integrations/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, events, active: true }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return toast.error(data.error ?? "Could not create webhook.");
    toast.success("Webhook created. Secret was generated automatically.");
    setLastSecret(data.secret ?? null);
    setName("");
    setUrl("");
    await refresh();
  }

  async function testWebhook(id: string) {
    const res = await fetch(`/api/admin/integrations/webhooks/${id}/test`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Could not enqueue test payload.");
    toast.success(`Test payload queued for ${data.queued ?? 0} webhook(s).`);
    await refresh();
  }

  async function retryDelivery(id: string) {
    const res = await fetch(`/api/admin/integrations/webhook-deliveries/${id}/retry`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "Could not retry delivery.");
    toast.success("Delivery queued for retry.");
    await refresh();
  }

  async function retryOutbox(id: string) {
    const res = await fetch(`/api/admin/integrations/outbox/${id}/retry`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "Could not retry integration job.");
    toast.success("Integration job queued for retry.");
    await refresh();
  }

  function toggleEvent(eventType: string, checked: boolean) {
    setEvents((current) => checked ? [...new Set([...current, eventType])] : current.filter((item) => item !== eventType));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-ink">Create outbound webhook</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.5fr]">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Webhook name" className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/webhook" className="rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {eventTypes.map((eventType) => (
            <label key={eventType} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-muted">
              <input type="checkbox" checked={events.includes(eventType)} onChange={(event) => toggleEvent(eventType, event.target.checked)} className="size-4 accent-brand-600" />
              {eventType}
            </label>
          ))}
        </div>
        <button onClick={createWebhook} disabled={saving || !name.trim() || !url.trim() || events.length === 0} className="mt-4 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50">
          {saving ? "Creating..." : "Create webhook"}
        </button>
        {lastSecret ? (
          <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-ink">
            <p className="font-semibold">Copy this webhook secret now. It is shown only once.</p>
            <code className="mt-2 block break-all rounded bg-white px-2 py-2 text-ink-muted">{lastSecret}</code>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Configured webhooks</h2>
          <p className="mt-1 text-xs text-ink-muted">Payloads are signed with X-YCP-Signature. Secrets are generated server-side and not displayed here.</p>
        </div>
        <div className="divide-y divide-line">
          {webhooks.length ? webhooks.map((webhook) => (
            <div key={webhook.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-medium text-ink">{webhook.name} <span className={webhook.active ? "text-success" : "text-ink-muted"}>{webhook.active ? "active" : "inactive"}</span></p>
                <p className="mt-1 break-all text-xs text-ink-muted">{webhook.url}</p>
                <p className="mt-1 text-xs text-ink-muted">{webhook.events.join(", ")}</p>
              </div>
              <button onClick={() => testWebhook(webhook.id)} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-raised">Test send</button>
            </div>
          )) : <p className="px-5 py-8 text-sm text-ink-muted">No outbound webhooks configured yet.</p>}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Webhook delivery log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-raised text-xs uppercase text-ink-muted"><tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Attempt</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Error</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-line">
              {deliveries.length ? deliveries.map((delivery) => (
                <tr key={delivery.id}><td className="px-4 py-3 font-medium text-ink">{delivery.event_type}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(delivery.status)}`}>{delivery.status}</span></td><td className="px-4 py-3">{delivery.attempt_number}</td><td className="px-4 py-3">{delivery.response_code ?? "-"}</td><td className="max-w-xs truncate px-4 py-3 text-ink-muted">{delivery.error_message ?? "-"}</td><td className="px-4 py-3 text-ink-muted">{new Date(delivery.created_at).toLocaleString()}</td><td className="px-4 py-3">{["failed", "dead_lettered"].includes(delivery.status) ? <button onClick={() => retryDelivery(delivery.id)} className="text-xs font-semibold text-brand-600 hover:underline">Retry</button> : "-"}</td></tr>
              )) : <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">No deliveries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Integration outbox</h2>
          <p className="mt-1 text-xs text-ink-muted">Provider adapter jobs such as GHL syncs run from this retry queue.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-surface-raised text-xs uppercase text-ink-muted"><tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Job</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Attempt</th><th className="px-4 py-3">Error</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-line">
              {outbox.length ? outbox.map((item) => (
                <tr key={item.id}><td className="px-4 py-3 font-medium text-ink">{item.provider}</td><td className="px-4 py-3">{item.job_type}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(item.status)}`}>{item.status}</span></td><td className="px-4 py-3">{item.attempt_number}</td><td className="max-w-xs truncate px-4 py-3 text-ink-muted">{item.error_message ?? "-"}</td><td className="px-4 py-3 text-ink-muted">{new Date(item.created_at).toLocaleString()}</td><td className="px-4 py-3">{["failed", "dead_lettered"].includes(item.status) ? <button onClick={() => retryOutbox(item.id)} className="text-xs font-semibold text-brand-600 hover:underline">Retry</button> : "-"}</td></tr>
              )) : <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">No integration jobs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
