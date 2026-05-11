import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Subtle background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 lg:px-8 pt-40 pb-24 text-center">
        {/* Eyebrow */}
        <div className="animate-fade-in-up inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[12px] font-semibold tracking-wide text-emerald-700 uppercase">
            $50M+ in recovered revenue powered by YourCreditPartner
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up animate-delay-100 mt-10 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
          Stop losing deals to
          <br />
          <span className="text-gradient-brand">bad credit.</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up animate-delay-200 mx-auto mt-8 max-w-2xl text-[clamp(1.05rem,2vw,1.25rem)] leading-[1.8] text-ink-muted">
          44% of credit reports have errors. Mortgage denials hit 22.6%. Solar sees 30% credit fails.
          Every declined client is revenue walking out the door.{" "}
          <span className="text-ink font-medium">We bring them back — and you get paid for it.</span>
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up animate-delay-300 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/apply"
            className="group inline-flex items-center justify-center rounded-full px-10 py-4 text-[16px] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
          >
            Start Earning Today
            <svg className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-medium text-ink-muted transition-all duration-300 hover:text-ink hover:bg-black/[0.03]"
          >
            See How It Works
          </a>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative mx-auto max-w-5xl px-6 lg:px-8 pb-24">
        <div className="animate-fade-in-up animate-delay-400 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { num: "22.6%", label: "Mortgage denials", desc: "Decade-high rejection rate" },
            { num: "30%", label: "Solar credit fails", desc: "Deals lost before install" },
            { num: "44%", label: "Reports with errors", desc: "Fixable with credit repair" },
            { num: "$0", label: "Cost to join", desc: "Free forever. No catches." },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-black/[0.06] bg-surface-soft p-6 text-center transition-all duration-300 hover:border-brand-200 hover:shadow-md"
            >
              <p className="text-3xl font-extrabold tracking-tight text-ink">{s.num}</p>
              <p className="mt-2 text-[13px] font-semibold text-ink-muted">{s.label}</p>
              <p className="mt-1 text-[11px] text-ink-muted/60">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tier section */}
      <div className="relative border-t border-black/[0.06] bg-surface-soft">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 py-24">
          <div className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600/60">
              Commission Structure
            </p>
            <h2 className="mt-4 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-ink">
              The more you refer, the more you earn.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">
              Retroactive tiers mean when you cross a threshold, every close that month
              recalculates at the higher rate. Not just the new ones — all of them.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { tier: "Starter", rate: "15%", closes: "1-9 closes/mo", earnings: "Up to $900/mo", accent: "#3B82F6" },
              { tier: "Producer", rate: "20%", closes: "10-24 closes/mo", earnings: "Up to $4,800/mo", accent: "#8B5CF6" },
              { tier: "Top Tier", rate: "25%", closes: "25-39 closes/mo", earnings: "Up to $9,750/mo", accent: "#F59E0B" },
              { tier: "Elite", rate: "35%", closes: "40+ closes/mo", earnings: "$14,000+/mo", accent: "#7C3AED" },
            ].map((t) => (
              <div
                key={t.tier}
                className="group rounded-2xl border border-black/[0.06] bg-white p-7 text-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-brand-200"
              >
                <p className="text-[42px] font-extrabold tracking-tight text-ink">{t.rate}</p>
                <p className="mt-1 text-[14px] font-bold" style={{ color: t.accent }}>{t.tier}</p>
                <div className="mx-auto mt-4 h-px w-12 bg-black/[0.06]" />
                <p className="mt-4 text-[13px] text-ink-muted">{t.closes}</p>
                <p className="mt-1 text-[13px] font-semibold text-emerald-600">{t.earnings}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-full border border-black/[0.08] bg-white px-8 py-3.5 text-[14px] font-semibold text-ink transition-all duration-300 hover:bg-surface-soft hover:border-brand-200 hover:shadow-md"
            >
              Apply in 2 Minutes — It&rsquo;s Free
            </Link>
            <p className="mt-4 text-[12px] text-ink-muted/50">
              No monthly fees &middot; No contracts &middot; No selling required &middot; Paid via Zelle
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
