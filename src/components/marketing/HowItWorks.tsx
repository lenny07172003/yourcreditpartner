const STEPS = [
  {
    number: "01",
    title: "Apply in 2 minutes",
    description: "Tell us about your profession and how you work with clients. No cost, no contracts, no catches.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Get approved & onboarded",
    description: "Reviewed within 24 hours. Get your dashboard, unique referral link, and fast-start training videos.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Refer clients",
    description: "Share your link or submit referrals from your dashboard. We handle consultations, follow-up, and service delivery.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Get paid monthly",
    description: "After the 30-day refund window, your commission is earned. Payouts hit your Zelle every month — no minimums.",
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white border-t border-black/[0.06]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 py-28">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600/60">
            How It Works
          </p>
          <h2 className="mt-4 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-ink">
            Four steps. That&rsquo;s it.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-ink-muted">
            From application to your first commission check — here&rsquo;s the entire process.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="group rounded-2xl border border-black/[0.06] bg-surface-soft p-7 transition-all duration-300 hover:shadow-lg hover:border-brand-200 hover:scale-[1.02]"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-100">
                {step.icon}
              </div>
              <p className="mt-5 text-[11px] font-bold tracking-widest text-ink-muted/40">
                STEP {step.number}
              </p>
              <h3 className="mt-2 text-[16px] font-bold text-ink">{step.title}</h3>
              <p className="mt-3 text-[13px] leading-[1.7] text-ink-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
