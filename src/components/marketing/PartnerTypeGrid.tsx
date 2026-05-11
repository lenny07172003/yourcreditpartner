import Link from "next/link";

const FEATURED = [
  {
    title: "Mortgage Loan Officers",
    stat: "22.6%",
    statLabel: "denial rate",
    tagline: "Nearly 1 in 4 mortgage applications get denied. That's not a lost lead — it's a future close waiting to happen. Refer them, we fix their credit, they come back qualified.",
    icon: (
      <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    title: "Solar Reps",
    stat: "30%",
    statLabel: "credit fails",
    tagline: "Almost a third of solar deals die on credit. Instead of losing the install, refer the client. We repair their score, you close the deal 60-90 days later.",
    icon: (
      <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    title: "Realtors",
    stat: "1 in 4",
    statLabel: "buyers blocked",
    tagline: "Pre-approval failed? Don't lose the relationship. Refer them for credit repair and stay top-of-mind when they're ready to buy.",
    icon: (
      <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
  },
  {
    title: "F&I Managers / Auto Dealers",
    stat: "$Billions",
    statLabel: "in subprime",
    tagline: "Subprime buyer sitting on your lot? Better credit tier means better rates, better backend, and a customer who comes back.",
    icon: (
      <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.375m-7.5-7.5h3.75m-3.75 0V3m0 3.75L12 3m0 3.75l1.125-3.75" />
      </svg>
    ),
  },
  {
    title: "Funding Companies",
    stat: "60%+",
    statLabel: "declined apps",
    tagline: "Most funding applications get denied due to credit. Instead of losing that lead, refer them to us. We fix their score, they come back fundable — and you earn a commission on top.",
    icon: (
      <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    title: "Insurance Agents",
    stat: "Credit",
    statLabel: "= buying power",
    tagline: "Your clients need better credit to qualify for leads, funding, and better rates. Refer them — they get the score they need, you earn a commission and keep a loyal client.",
    icon: (
      <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

const OTHER_TYPES = [
  { title: "Financial Advisors", desc: "Wealth plan blocked by a bad score? Fix the foundation first — clients come back with more options for you to manage." },
  { title: "Tax Professionals / CPAs", desc: "You see client debt firsthand. You're the most trusted person to recommend credit repair." },
  { title: "Roofers / Contractors", desc: "Financing-dependent jobs stall on bad credit. We unblock the funding so you get the contract." },
  { title: "Personal Injury Attorneys", desc: "Post-settlement clients have capital and motivation to rebuild. Perfect timing for a referral." },
  { title: "HR / Benefits Brokers", desc: "Offer credit repair as a financial wellness benefit — employees get help, you earn commissions." },
  { title: "Business Coaches", desc: "Clients need clean credit before stacking business funding. Fix the score, unlock the capital." },
  { title: "Property Managers", desc: "Turn failed tenant screenings into future qualified applicants. Help them, earn from them." },
  { title: "Bankruptcy Attorneys", desc: "Post-discharge clients are motivated to rebuild their credit. You're their first call — monetize it." },
  { title: "Real Estate Investors", desc: "Tenant screening or rent-to-own pipeline — natural fit for credit repair referrals." },
  { title: "Individual Referrers", desc: "Friends, family, anyone you know who needs credit help. Earn like an affiliate with zero overhead." },
];

export function PartnerTypeGrid() {
  return (
    <section id="partner-types" className="bg-surface-soft border-t border-black/[0.06]">
      <div className="mx-auto max-w-6xl px-6 lg:px-8 py-28">
        {/* Header */}
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600/60">
            Who This Is For
          </p>
          <h2 className="mt-4 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-ink">
            If your clients need credit, you need this.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
            Every professional who works with people making financial decisions has clients
            getting blocked by bad credit. That&rsquo;s not a problem — it&rsquo;s an opportunity.
          </p>
        </div>

        {/* Featured 6 — large cards */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((pt) => (
            <div
              key={pt.title}
              className="group rounded-2xl border border-black/[0.06] bg-white p-8 transition-all duration-300 hover:shadow-xl hover:border-brand-200 hover:scale-[1.02]"
            >
              {/* Icon + stat row */}
              <div className="flex items-start justify-between">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                  {pt.icon}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold tracking-tight text-ink">{pt.stat}</p>
                  <p className="text-[11px] text-ink-muted/60">{pt.statLabel}</p>
                </div>
              </div>

              <h3 className="mt-6 text-[17px] font-bold text-ink">{pt.title}</h3>
              <p className="mt-3 text-[13px] leading-[1.8] text-ink-muted">{pt.tagline}</p>
            </div>
          ))}
        </div>

        {/* Other types — compact row */}
        <div className="mt-12 rounded-2xl border border-black/[0.06] bg-white p-8">
          <p className="text-[13px] font-semibold text-ink">
            Also perfect for:
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {OTHER_TYPES.map((t) => (
              <div key={t.title} className="group relative">
                <span className="inline-flex cursor-pointer rounded-full border border-black/[0.06] bg-surface-soft px-5 py-2.5 text-[13px] font-medium text-ink-muted transition-all duration-300 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md">
                  {t.title}
                </span>
                {/* Hover expand tooltip */}
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 rounded-xl border border-black/[0.08] bg-white p-5 shadow-xl opacity-0 scale-95 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto z-20">
                  <p className="text-[13px] font-bold text-ink">{t.title}</p>
                  <p className="mt-2 text-[12px] leading-[1.7] text-ink-muted">{t.desc}</p>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 size-4 rotate-45 border-r border-b border-black/[0.08] bg-white" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-ink-muted">
            Anyone who works with clients making financial decisions can earn.{" "}
            <Link href="/apply" className="font-semibold text-brand-600 hover:underline">
              Apply now →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
