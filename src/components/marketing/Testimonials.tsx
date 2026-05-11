const TESTIMONIALS = [
  {
    quote: "I had a buyer get denied two weeks before closing. Instead of losing the deal, I referred them here. Six months later they closed on their home — and I got a commission check I wasn't expecting.",
    name: "Marcus T.",
    title: "Mortgage Loan Officer, Atlanta GA",
    result: "Saved a $380K deal",
  },
  {
    quote: "My solar pipeline was stalling on credit declines. Now I refer those leads instead of dropping them. It's extra income for work I was already doing — I just stopped throwing leads away.",
    name: "Priya S.",
    title: "Solar Sales Rep, Phoenix AZ",
    result: "Recovered 30% of lost leads",
  },
  {
    quote: "As a financial advisor, my clients need clean credit before I can build real wealth plans. Referring them here keeps them in my pipeline and earns me a commission. It's a no-brainer.",
    name: "David R.",
    title: "Financial Advisor, Dallas TX",
    result: "12 referrals in first month",
  },
];

export function Testimonials() {
  return (
    <section className="bg-surface-soft border-t border-black/[0.06]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 py-28">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600/60">
            Partner Stories
          </p>
          <h2 className="mt-4 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-ink">
            They stopped losing deals.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-ink-muted">
            Real professionals who turned credit-declined clients into commissions.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="group flex flex-col rounded-2xl border border-black/[0.06] bg-white p-7 transition-all duration-300 hover:shadow-lg hover:border-brand-200"
            >
              <span className="inline-flex self-start rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                {t.result}
              </span>

              <blockquote className="mt-5 flex-1 text-[14px] leading-[1.8] text-ink-muted">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center gap-3 border-t border-black/[0.06] pt-5">
                <div className="flex size-10 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{t.name}</p>
                  <p className="text-[11px] text-ink-muted">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
