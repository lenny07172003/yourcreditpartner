import Link from "next/link";

export function FooterCTA() {
  return (
    <section className="relative overflow-hidden bg-white border-t border-black/[0.06]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, #4F46E5 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 lg:px-8 py-28 text-center">
        <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold tracking-tight text-ink leading-[1.1]">
          Ready to recover your
          <br />
          <span className="text-gradient-brand">lost revenue?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-ink-muted">
          Join professionals across 16 industries who stopped losing deals to bad credit
          and started earning commissions instead. Apply in 2 minutes.
        </p>

        <div className="mt-10">
          <Link
            href="/apply"
            className="group inline-flex items-center justify-center rounded-full px-10 py-4 text-[16px] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
          >
            Apply to Partner — Free
            <svg className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <p className="mt-6 text-[12px] text-ink-muted/40">
          Reviewed within 24 hours &middot; Paid monthly via Zelle &middot; No monthly fees &middot; No contracts
        </p>
      </div>
    </section>
  );
}
