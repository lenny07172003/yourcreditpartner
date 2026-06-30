import type { SupabaseClient } from "@supabase/supabase-js";
import { pushPartnerToGhl, pushReferralToGhl } from "@/lib/ghl/push-contact";

const BACKOFF_MINUTES = [1, 5, 30, 120, 720, 1440];

type IntegrationProvider = "ghl" | "twilio" | "stripe" | "resend" | "cal_com" | "webhook";

type IntegrationJob = {
  id: string;
  org_id: string;
  provider: IntegrationProvider;
  job_type: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: Record<string, unknown>;
  attempt_number: number;
  max_attempts: number;
};

function nextRetryAt(attemptNumber: number) {
  const minutes = BACKOFF_MINUTES[Math.max(0, Math.min(attemptNumber - 1, BACKOFF_MINUTES.length - 1))];
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export async function isTenantIntegrationEnabled(
  supabase: SupabaseClient,
  orgId: string,
  provider: Exclude<IntegrationProvider, "webhook">
) {
  const { data, error } = await supabase
    .from("tenant_integrations")
    .select("enabled")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .maybeSingle();
  if (error) return false;
  return data?.enabled === true;
}

export async function enqueueIntegrationJob(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    provider: IntegrationProvider;
    jobType: string;
    aggregateType?: string;
    aggregateId?: string;
    payload: Record<string, unknown>;
    runAt?: string;
  }
) {
  const { data, error } = await supabase
    .from("integration_outbox")
    .insert({
      org_id: input.orgId,
      provider: input.provider,
      job_type: input.jobType,
      aggregate_type: input.aggregateType ?? null,
      aggregate_id: input.aggregateId ?? null,
      payload: input.payload,
      next_attempt_at: input.runAt ?? new Date().toISOString(),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function enqueueGhlJobIfEnabled(
  supabase: SupabaseClient,
  input: {
    orgId: string;
    jobType: "ghl.partner.upsert" | "ghl.referral.upsert";
    aggregateType: "partner" | "referral";
    aggregateId: string;
    payload: Record<string, unknown>;
  }
) {
  const enabled = await isTenantIntegrationEnabled(supabase, input.orgId, "ghl");
  if (!enabled) return null;
  return enqueueIntegrationJob(supabase, {
    orgId: input.orgId,
    provider: "ghl",
    jobType: input.jobType,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    payload: input.payload,
  });
}

async function markJobFailure(
  supabase: SupabaseClient,
  job: IntegrationJob,
  errorMessage: string
) {
  const finalAttempt = job.attempt_number >= job.max_attempts;
  await supabase
    .from("integration_outbox")
    .update({
      status: finalAttempt ? "dead_lettered" : "failed",
      error_message: errorMessage.slice(0, 1000),
      response: null,
      last_attempt_at: new Date().toISOString(),
      completed_at: finalAttempt ? new Date().toISOString() : null,
      attempt_number: finalAttempt ? job.attempt_number : job.attempt_number + 1,
      next_attempt_at: finalAttempt ? null : nextRetryAt(job.attempt_number),
    })
    .eq("id", job.id);
}

async function processGhlJob(supabase: SupabaseClient, job: IntegrationJob) {
  if (job.job_type === "ghl.partner.upsert") {
    await pushPartnerToGhl(supabase, {
      orgId: job.org_id,
      partnerId: String(job.payload.partnerId),
      firstName: String(job.payload.firstName),
      lastName: String(job.payload.lastName),
      email: String(job.payload.email),
      phone: String(job.payload.phone),
      partnerSlug: String(job.payload.partnerSlug),
      partnerType: String(job.payload.partnerType),
      companyName: typeof job.payload.companyName === "string" ? job.payload.companyName : undefined,
    });
    return { ok: true };
  }

  if (job.job_type === "ghl.referral.upsert") {
    await pushReferralToGhl(supabase, String(job.aggregate_id), {
      orgId: job.org_id,
      clientFirstName: String(job.payload.clientFirstName),
      clientLastName: String(job.payload.clientLastName),
      clientEmail: String(job.payload.clientEmail),
      clientPhone: typeof job.payload.clientPhone === "string" ? job.payload.clientPhone : undefined,
      partnerId: String(job.payload.partnerId),
      partnerSlug: String(job.payload.partnerSlug),
      partnerType: String(job.payload.partnerType),
      partnerFirstName: String(job.payload.partnerFirstName),
      partnerLastName: String(job.payload.partnerLastName),
      partnerCompany: typeof job.payload.partnerCompany === "string" ? job.payload.partnerCompany : undefined,
    });
    return { ok: true };
  }

  throw new Error(`Unsupported GHL job type: ${job.job_type}`);
}

export async function processIntegrationJob(supabase: SupabaseClient, job: IntegrationJob) {
  await supabase
    .from("integration_outbox")
    .update({ status: "processing", last_attempt_at: new Date().toISOString() })
    .eq("id", job.id);

  try {
    if (job.provider === "ghl") {
      const response = await processGhlJob(supabase, job);
      await supabase
        .from("integration_outbox")
        .update({
          status: "succeeded",
          response,
          error_message: null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      return true;
    }

    await supabase
      .from("integration_outbox")
      .update({
        status: "skipped",
        response: { reason: `Provider ${job.provider} processor is not implemented yet.` },
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return true;
  } catch (error) {
    await markJobFailure(
      supabase,
      job,
      error instanceof Error ? error.message : "Unknown integration job error"
    );
    return false;
  }
}

export async function processDueIntegrationOutbox(supabase: SupabaseClient, limit = 100) {
  const { data, error } = await supabase
    .from("integration_outbox")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  let succeeded = 0;
  let failed = 0;
  for (const job of (data ?? []) as IntegrationJob[]) {
    const ok = await processIntegrationJob(supabase, job);
    if (ok) succeeded++;
    else failed++;
  }

  return { processed: data?.length ?? 0, succeeded, failed };
}

