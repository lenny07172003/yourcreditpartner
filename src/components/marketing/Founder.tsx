export function Founder() {
  return (
    <section className="bg-white border-t border-black/[0.06]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 py-28">
        <div className="grid gap-12 lg:grid-cols-[280px,1fr] lg:items-center">
          {/* Photo */}
          <div className="flex justify-center lg:justify-start">
            <div className="size-64 lg:size-72 rounded-2xl overflow-hidden border-2 border-black/[0.06] bg-surface-soft flex items-center justify-center">
              {/* Replace with <img src="/founder.jpg" /> once you have a photo */}
              <span className="text-5xl font-bold text-gradient-brand">LA</span>
            </div>
          </div>

          {/* Bio */}
          <div className="text-center lg:text-left">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600/60">
              About The Founder
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold tracking-tight text-ink">
              Leonard Ali-Permell
            </h2>
            <p className="mt-2 text-[14px] font-medium text-brand-600/60">
              Founder, YourCreditPartner &middot; President, Opulent Consulting Group
            </p>
            <p className="mt-1 text-[12px] text-ink-muted/60">
              B.S. Finance, University of Delaware &middot; Cornell Law Institute
            </p>

            <div className="mt-6 space-y-4 text-[15px] leading-[1.8] text-ink-muted">
              <p>
                Lenny holds a bachelor&rsquo;s degree in Finance with a minor in Business Law
                from the{" "}
                <span className="text-ink font-medium">University of Delaware</span>, and has
                cultivated specialized expertise in consumer protection jurisprudence through
                rigorous study at the{" "}
                <span className="text-ink font-medium">Cornell Law Institute</span>.
              </p>
              <p>
                Early in his career, he established Opulent Credit Consulting — a boutique
                credit remediation firm that has facilitated hundreds of clients in leveraging
                consumer protection statutes to{" "}
                <span className="text-ink font-medium">
                  restore creditworthiness and unlock substantive financial autonomy.
                </span>
              </p>
              <p>
                Yet Lenny identified a systemic market inefficiency: thousands of commissioned
                professionals — mortgage originators, solar energy specialists, automotive dealers,
                real estate brokers — were{" "}
                <span className="text-ink font-medium">
                  forfeiting transactions due to their clients&rsquo; constrained credit profiles.
                </span>
              </p>
              <p>
                This recognition catalyzed the development of{" "}
                <span className="text-ink font-medium">YourCreditPartner</span> — a sophisticated
                B2B infrastructure platform engineered to bridge credit expertise with the
                professionals whose commercial outcomes depend upon it. It represents the
                convergence of financial restoration and enterprise growth.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-8 justify-center lg:justify-start">
              {[
                { num: "5,200+", label: "Clients served" },
                { num: "16+", label: "Industries served" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-extrabold text-ink">{s.num}</p>
                  <p className="text-[11px] text-ink-muted/60 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
