import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Partner } from "@/types/database";
import { loadTiers, getTierForCloses, getCloseCountForMonth } from "@/lib/commissions/tier-engine";
import { AgreementViewer } from "./AgreementViewer";

interface Props {
  params: Promise<{ id: string }>;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value ?? <span className="text-ink-muted">—</span>}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <h2 className="mb-4 text-sm font-semibold text-ink">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function formatDt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const STAGE_BADGE: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  booked: "bg-yellow-100 text-yellow-700",
  consulted: "bg-purple-100 text-purple-700",
  closed_won: "bg-success/10 text-success",
  active_service: "bg-success/10 text-success",
  net_revenue_realized: "bg-success/10 text-success",
  refunded: "bg-danger/10 text-danger",
};

const COMMISSION_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  earned: "bg-blue-100 text-blue-700",
  payable: "bg-purple-100 text-purple-700",
  paid: "bg-success/10 text-success",
  voided: "bg-danger/10 text-danger",
};

export default async function AdminPartnerDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: partner } = await admin
    .from("partners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!partner) notFound();

  const p = partner as Partner;

  const now = new Date();
  const closeMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Load everything in parallel
  const [referralsResult, commissionsResult, tiersData, closeCount, referredByResult] = await Promise.all([
    admin
      .from("referrals")
      .select("*")
      .eq("partner_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("commissions")
      .select("*")
      .eq("partner_id", id)
      .neq("state", "voided")
      .order("created_at", { ascending: false }),
    loadTiers(admin).catch(() => []),
    getCloseCountForMonth(admin, id, closeMonth).catch(() => 0),
    admin
      .from("partners")
      .select("first_name, last_name, partner_slug")
      .eq("id", p.referred_by_partner_id ?? "___none___")
      .maybeSingle(),
  ]);

  const referrals = referralsResult.data ?? [];
  const commissions = commissionsResult.data ?? [];

  const tierInfo = tiersData.length > 0
    ? getTierForCloses(tiersData, closeCount)
    : { tier: 1 as const, rate: 0.15, displayName: "Starter", minCloses: 1, maxCloses: 9 };
  const nextTier = tiersData.find((t) => t.tier_number === tierInfo.tier + 1);

  // Pipeline counts
  const pipeline = {
    submitted: referrals.filter((r) => r.stage === "submitted").length,
    booked: referrals.filter((r) => r.stage === "booked").length,
    consulted: referrals.filter((r) => r.stage === "consulted").length,
    closed: referrals.filter((r) => ["closed_won", "active_service", "net_revenue_realized"].includes(r.stage)).length,
    refunded: referrals.filter((r) => r.stage === "refunded").length,
  };

  const totalEarned = commissions.reduce((s, c) => s + c.amount_cents, 0);
  const totalPaid = commissions.filter((c) => c.state === "paid").reduce((s, c) => s + c.amount_cents, 0);

  const statusColor = {
    active: "bg-success/10 text-success",
    paused: "bg-warning/10 text-warning",
    terminated: "bg-danger/10 text-danger",
  }[p.status] ?? "bg-surface-raised text-ink-muted";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/partners" className="text-xs text-brand-600 hover:underline">
            ← All Partners
          </Link>
          <h1 className="mt-2 text-xl font-bold text-ink">
            {p.first_name} {p.last_name}
          </h1>
          <p className="text-sm text-ink-muted">{p.email}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor}`}>
          {p.status}
        </span>
      </div>

      {/* Tier + Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-accent-50 p-5">
          <p className="text-xs font-medium uppercase text-brand-600">Current Tier</p>
          <p className="mt-1 text-xl font-bold text-brand-900">{tierInfo.displayName}</p>
          <p className="mt-1 text-sm font-semibold text-brand-700">{(tierInfo.rate * 100).toFixed(0)}%</p>
          <p className="mt-1 text-xs text-brand-600">
            {closeCount} closes MTD
            {nextTier ? ` · ${nextTier.min_closes - closeCount} to ${nextTier.display_name}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase text-ink-muted">Total Referrals</p>
          <p className="mt-1 text-2xl font-bold text-ink">{referrals.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase text-ink-muted">Total Earned</p>
          <p className="mt-1 text-2xl font-bold text-ink">${(totalEarned / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase text-ink-muted">Total Paid</p>
          <p className="mt-1 text-2xl font-bold text-success">${(totalPaid / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Referral Pipeline</h2>
        <div className="flex gap-2">
          {[
            { label: "Submitted", count: pipeline.submitted, color: "bg-blue-500" },
            { label: "Booked", count: pipeline.booked, color: "bg-yellow-500" },
            { label: "Consulted", count: pipeline.consulted, color: "bg-purple-500" },
            { label: "Closed", count: pipeline.closed, color: "bg-success" },
            { label: "Refunded", count: pipeline.refunded, color: "bg-danger" },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center">
              <div className={`mx-auto mb-2 h-2 w-full rounded-full ${s.color} opacity-20`}>
                <div className={`h-2 rounded-full ${s.color}`} style={{ width: s.count > 0 ? "100%" : "0%" }} />
              </div>
              <p className="text-xl font-bold text-ink">{s.count}</p>
              <p className="text-[10px] font-medium uppercase text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals table */}
      <div className="rounded-xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold text-ink">All Referrals ({referrals.length})</h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Booked</th>
              <th className="px-4 py-3">Consulted</th>
              <th className="px-4 py-3">Closed</th>
              <th className="px-4 py-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-muted">
                  No referrals from this partner yet.
                </td>
              </tr>
            ) : (
              referrals.map((r) => (
                <tr key={r.id} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3 text-sm font-medium text-ink">
                    {r.client_first_name} {r.client_last_name}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{r.client_email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STAGE_BADGE[r.stage] ?? "bg-surface-raised text-ink-muted"}`}>
                      {r.stage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {r.booked_at ? new Date(r.booked_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {r.consulted_at ? new Date(r.consulted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {r.closed_won_at ? new Date(r.closed_won_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {r.gross_revenue_cents ? `$${(r.gross_revenue_cents / 100).toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Commissions table */}
      <div className="rounded-xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold text-ink">Commissions ({commissions.length})</h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Net Revenue</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-muted">
                  No commissions yet.
                </td>
              </tr>
            ) : (
              commissions.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-surface-soft">
                  <td className="px-4 py-3 text-sm text-ink">{c.close_month}</td>
                  <td className="px-4 py-3 text-sm text-ink-muted">${(c.net_revenue_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-ink-muted">{(c.commission_rate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">${(c.amount_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${COMMISSION_BADGE[c.state] ?? "bg-surface-raised text-ink-muted"}`}>
                      {c.state}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Partner Profile */}
      <Section title="Partner Profile">
        <Field label="Partner type" value={p.partner_type} />
        <Field label="Company" value={p.company_name} />
        <Field label="Phone" value={p.phone} />
        <Field label="State" value={p.state_of_operation} />
        <Field label="Expected volume" value={p.expected_volume} />
        <Field label="Partner slug" value={p.partner_slug} />
        <Field label="Member since" value={formatDt(p.created_at)} />
        <Field label="Last referral" value={formatDt(p.last_submission_at)} />
        <Field label="Referred by" value={
          referredByResult.data
            ? `${referredByResult.data.first_name} ${referredByResult.data.last_name}`
            : "Direct signup"
        } />
      </Section>

      {/* Agreement / Signature */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">
          Affiliate Agreement — Signature on File
        </h2>
        {p.agreement_signed_at ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-dashed border-brand-300 bg-brand-50 p-5">
              <p className="text-[10px] uppercase tracking-widest text-brand-400">Digital Signature</p>
              <p className="mt-2 text-3xl text-ink" style={{ fontFamily: "cursive" }}>
                {p.agreement_signature_name ?? `${p.first_name} ${p.last_name}`}
              </p>
              <div className="mt-3 h-px w-48 bg-ink/20" />
              <p className="mt-1 text-xs text-ink-muted">
                {p.agreement_signature_name ?? `${p.first_name} ${p.last_name}`}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Agreement version" value={p.agreement_version} />
              <Field label="Signed at" value={formatDt(p.agreement_signed_at)} />
              <Field label="Signature name" value={p.agreement_signature_name} />
              <Field label="IP address" value={p.agreement_ip} />
            </div>
            <AgreementViewer version={p.agreement_version} />
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No agreement on file.</p>
        )}
      </div>

      {/* Internal */}
      <Section title="Internal">
        <div className="sm:col-span-2">
          <Field label="Internal notes" value={p.notes_internal} />
        </div>
        <Field label="Commission rate override" value={p.commission_rate_override?.toString()} />
        <Field label="W-9 on file" value={p.w9_url ? "Yes" : "No"} />
        <Field label="Zelle handle" value={p.zelle_handle} />
      </Section>
    </div>
  );
}
