"use client";

import { useState } from "react";

const TIERS = [
  { min: 1, max: 9, rate: 0.15, label: "Starter", color: "#3B82F6" },
  { min: 10, max: 24, rate: 0.20, label: "Producer", color: "#8B5CF6" },
  { min: 25, max: 39, rate: 0.25, label: "Top Tier", color: "#F59E0B" },
  { min: 40, max: 60, rate: 0.35, label: "Elite", color: "#7C3AED" },
];

const AVG_NET_REVENUE = 1200;

function getTier(closes: number) {
  return TIERS.find((t) => closes >= t.min && closes <= t.max) ?? TIERS[3];
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function EarningsCalculator() {
  const [closes, setCloses] = useState(5);

  const tier = getTier(closes);
  const monthly = Math.round(closes * AVG_NET_REVENUE * tier.rate);
  const annual = monthly * 12;
  const nextTier = TIERS.find((t) => t.min > closes);
  const closesToNextTier = nextTier ? nextTier.min - closes : 0;

  return (
    <section id="calculator" className="bg-white border-t border-black/[0.06]">
      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-28">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600/60">
            Earnings Calculator
          </p>
          <h2 className="mt-4 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-ink">
            See what your referrals are worth.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-ink-muted">
            Based on average net revenue of{" "}
            <span className="text-ink font-medium">{fmt(AVG_NET_REVENUE)}</span>{" "}
            per closed client after waterfall.
          </p>
        </div>

        <div className="mt-14 rounded-2xl border border-black/[0.08] bg-surface-soft p-8 sm:p-10">
          <div>
            <div className="flex items-end justify-between">
              <label className="text-[13px] font-medium text-ink-muted">Closes per month</label>
              <span className="text-4xl font-extrabold tracking-tight text-ink">{closes}</span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={closes}
              onChange={(e) => setCloses(Number(e.target.value))}
              className="mt-4 w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #4F46E5 0%, #7C3AED ${(closes / 60) * 100}%, #E2E8F0 ${(closes / 60) * 100}%)`,
              }}
            />
            <div className="mt-2 flex justify-between text-[11px] text-ink-muted/50">
              <span>1</span>
              <span>60</span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="size-3 rounded-full" style={{ background: tier.color }} />
            <span className="text-[14px] font-bold text-ink">{tier.label} Tier</span>
            <span className="rounded-full border border-black/[0.08] bg-white px-3 py-1 text-[12px] font-medium text-ink-muted">
              {(tier.rate * 100).toFixed(0)}% commission
            </span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted/50">Monthly</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-ink">{fmt(monthly)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600/60">Annual</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-emerald-700">{fmt(annual)}</p>
            </div>
          </div>

          {nextTier && (
            <p className="mt-6 text-center text-[13px] text-ink-muted">
              <span className="text-ink font-medium">{closesToNextTier} more close{closesToNextTier !== 1 ? "s" : ""}</span>{" "}
              to unlock {nextTier.label} ({(nextTier.rate * 100).toFixed(0)}%) — retroactive on all closes this month.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-ink-muted/40">
          Estimates are illustrative. Actual commissions depend on gross revenue, processing fees, and closer share.
        </p>
      </div>
    </section>
  );
}
