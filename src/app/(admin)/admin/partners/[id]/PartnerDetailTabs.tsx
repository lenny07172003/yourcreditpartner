"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AgreementViewer } from "./AgreementViewer";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Referral {
  id: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  stage: string;
  created_at: string;
  booked_at: string | null;
  consulted_at: string | null;
  closed_won_at: string | null;
  gross_revenue_cents: number | null;
}

interface Commission {
  id: string;
  close_month: string;
  net_revenue_cents: number;
  commission_rate: number;
  amount_cents: number;
  state: string;
}

interface TierInfo {
  tier: number;
  rate: number;
  displayName: string;
  minCloses: number;
  maxCloses: number | null;
}

interface NextTier {
  display_name: string;
  min_closes: number;
}

interface Pipeline {
  submitted: number;
  booked: number;
  consulted: number;
  closed: number;
  refunded: number;
}

interface PartnerData {
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  partner_type: string | null;
  company_name: string | null;
  phone: string | null;
  state_of_operation: string | null;
  expected_volume: string | null;
  partner_slug: string | null;
  created_at: string;
  last_submission_at: string | null;
  notes_internal: string | null;
  commission_rate_override: number | null;
  w9_url: string | null;
  zelle_handle: string | null;
  agreement_signed_at: string | null;
  agreement_signature_name: string | null;
  agreement_version: string;
  agreement_ip: string | null;
}

export interface PartnerDetailTabsProps {
  partner: PartnerData;
  referrals: Referral[];
  commissions: Commission[];
  tierInfo: TierInfo;
  nextTier: NextTier | null;
  closeCount: number;
  pipeline: Pipeline;
  totalEarned: number;
  totalPaid: number;
  referredByName: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-ink">
        {value ?? <span className="text-ink-muted">—</span>}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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

/* ------------------------------------------------------------------ */
/*  Tab content components                                            */
/* ------------------------------------------------------------------ */

function OverviewTab({
  tierInfo,
  nextTier,
  closeCount,
  referrals,
  totalEarned,
  totalPaid,
  pipeline,
}: Pick<
  PartnerDetailTabsProps,
  | "tierInfo"
  | "nextTier"
  | "closeCount"
  | "referrals"
  | "totalEarned"
  | "totalPaid"
  | "pipeline"
>) {
  return (
    <div className="space-y-6">
      {/* Tier + Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-accent-50 p-5">
          <p className="text-xs font-medium uppercase text-brand-600">
            Current Tier
          </p>
          <p className="mt-1 text-xl font-bold text-brand-900">
            {tierInfo.displayName}
          </p>
          <p className="mt-1 text-sm font-semibold text-brand-700">
            {(tierInfo.rate * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-brand-600">
            {closeCount} closes MTD
            {nextTier
              ? ` · ${nextTier.min_closes - closeCount} to ${nextTier.display_name}`
              : ""}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase text-ink-muted">
            Total Referrals
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">{referrals.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase text-ink-muted">
            Total Earned
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            ${(totalEarned / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase text-ink-muted">
            Total Paid
          </p>
          <p className="mt-1 text-2xl font-bold text-success">
            ${(totalPaid / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">
          Referral Pipeline
        </h2>
        <div className="flex gap-2">
          {[
            { label: "Submitted", count: pipeline.submitted, color: "bg-blue-500" },
            { label: "Booked", count: pipeline.booked, color: "bg-yellow-500" },
            { label: "Consulted", count: pipeline.consulted, color: "bg-purple-500" },
            { label: "Closed", count: pipeline.closed, color: "bg-success" },
            { label: "Refunded", count: pipeline.refunded, color: "bg-danger" },
          ].map((s) => (
            <div key={s.label} className="flex-1 text-center">
              <div
                className={`mx-auto mb-2 h-2 w-full rounded-full ${s.color} opacity-20`}
              >
                <div
                  className={`h-2 rounded-full ${s.color}`}
                  style={{ width: s.count > 0 ? "100%" : "0%" }}
                />
              </div>
              <p className="text-xl font-bold text-ink">{s.count}</p>
              <p className="text-[10px] font-medium uppercase text-ink-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReferralsTab({ referrals }: { referrals: Referral[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line px-6 py-4">
        <h2 className="text-sm font-semibold text-ink">
          All Referrals ({referrals.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
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
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-ink-muted"
                >
                  No referrals from this partner yet.
                </td>
              </tr>
            ) : (
              referrals.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-line hover:bg-surface-soft"
                >
                  <td className="px-4 py-3 text-sm font-medium text-ink">
                    {r.client_first_name} {r.client_last_name}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {r.client_email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STAGE_BADGE[r.stage] ?? "bg-surface-raised text-ink-muted"}`}
                    >
                      {r.stage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {shortDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {r.booked_at ? shortDate(r.booked_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {r.consulted_at ? shortDate(r.consulted_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {r.closed_won_at ? shortDate(r.closed_won_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {r.gross_revenue_cents
                      ? `$${(r.gross_revenue_cents / 100).toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommissionsTab({ commissions }: { commissions: Commission[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line px-6 py-4">
        <h2 className="text-sm font-semibold text-ink">
          Commissions ({commissions.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
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
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-ink-muted"
                >
                  No commissions yet.
                </td>
              </tr>
            ) : (
              commissions.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-line hover:bg-surface-soft"
                >
                  <td className="px-4 py-3 text-sm text-ink">
                    {c.close_month}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    ${(c.net_revenue_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {(c.commission_rate * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-ink">
                    ${(c.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${COMMISSION_BADGE[c.state] ?? "bg-surface-raised text-ink-muted"}`}
                    >
                      {c.state}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileTab({
  partner,
  referredByName,
}: {
  partner: PartnerData;
  referredByName: string | null;
}) {
  return (
    <div className="space-y-6">
      <Section title="Partner Profile">
        <Field label="Partner type" value={partner.partner_type} />
        <Field label="Company" value={partner.company_name} />
        <Field label="Phone" value={partner.phone} />
        <Field label="State" value={partner.state_of_operation} />
        <Field label="Expected volume" value={partner.expected_volume} />
        <Field label="Partner slug" value={partner.partner_slug} />
        <Field label="Member since" value={formatDt(partner.created_at)} />
        <Field
          label="Last referral"
          value={formatDt(partner.last_submission_at)}
        />
        <Field
          label="Referred by"
          value={referredByName ?? "Direct signup"}
        />
      </Section>

      <Section title="Internal">
        <div className="sm:col-span-2">
          <Field label="Internal notes" value={partner.notes_internal} />
        </div>
        <Field
          label="Commission rate override"
          value={partner.commission_rate_override?.toString()}
        />
        <Field label="W-9 on file" value={partner.w9_url ? "Yes" : "No"} />
        <Field label="Zelle handle" value={partner.zelle_handle} />
      </Section>
    </div>
  );
}

function AgreementTab({ partner }: { partner: PartnerData }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <h2 className="mb-4 text-sm font-semibold text-ink">
        Affiliate Agreement — Signature on File
      </h2>
      {partner.agreement_signed_at ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-dashed border-brand-300 bg-brand-50 p-5">
            <p className="text-[10px] uppercase tracking-widest text-brand-400">
              Digital Signature
            </p>
            <p
              className="mt-2 text-3xl text-ink"
              style={{ fontFamily: "cursive" }}
            >
              {partner.agreement_signature_name ??
                `${partner.first_name} ${partner.last_name}`}
            </p>
            <div className="mt-3 h-px w-48 bg-ink/20" />
            <p className="mt-1 text-xs text-ink-muted">
              {partner.agreement_signature_name ??
                `${partner.first_name} ${partner.last_name}`}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Agreement version"
              value={partner.agreement_version}
            />
            <Field
              label="Signed at"
              value={formatDt(partner.agreement_signed_at)}
            />
            <Field
              label="Signature name"
              value={partner.agreement_signature_name}
            />
            <Field label="IP address" value={partner.agreement_ip} />
          </div>
          <AgreementViewer version={partner.agreement_version} />
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No agreement on file.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function PartnerDetailTabs({
  partner,
  referrals,
  commissions,
  tierInfo,
  nextTier,
  closeCount,
  pipeline,
  totalEarned,
  totalPaid,
  referredByName,
}: PartnerDetailTabsProps) {
  return (
    <Tabs defaultValue={0}>
      <TabsList variant="line" className="w-full justify-start border-b border-line">
        <TabsTrigger value={0}>Overview</TabsTrigger>
        <TabsTrigger value={1}>Referrals</TabsTrigger>
        <TabsTrigger value={2}>Commissions</TabsTrigger>
        <TabsTrigger value={3}>Profile</TabsTrigger>
        <TabsTrigger value={4}>Agreement</TabsTrigger>
      </TabsList>

      <TabsContent value={0} className="pt-6">
        <OverviewTab
          tierInfo={tierInfo}
          nextTier={nextTier}
          closeCount={closeCount}
          referrals={referrals}
          totalEarned={totalEarned}
          totalPaid={totalPaid}
          pipeline={pipeline}
        />
      </TabsContent>

      <TabsContent value={1} className="pt-6">
        <ReferralsTab referrals={referrals} />
      </TabsContent>

      <TabsContent value={2} className="pt-6">
        <CommissionsTab commissions={commissions} />
      </TabsContent>

      <TabsContent value={3} className="pt-6">
        <ProfileTab partner={partner} referredByName={referredByName} />
      </TabsContent>

      <TabsContent value={4} className="pt-6">
        <AgreementTab partner={partner} />
      </TabsContent>
    </Tabs>
  );
}
