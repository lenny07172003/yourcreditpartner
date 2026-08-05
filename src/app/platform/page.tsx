import Link from "next/link";
import Image from "next/image";
import {
  CalendarCheck2,
  TrendingUp,
  Mail,
  Trophy,
  Webhook,
  Palette,
  ShieldCheck,
  LayoutDashboard,
  Check,
} from "lucide-react";

export const metadata = {
  title: "YourCreditPartner Platform — White-Label Referral Software for Credit Repair Companies",
  description:
    "Run your own partner referral program. Onboarding, attribution, calendar booking, commission accounting, client nurture, and payouts — owned end to end, white-labeled to your brand.",
};

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Partner onboarding & agreements",
    desc: "Multi-step apply flow, clickwrap agreement with signed PDF, magic-link login — live in minutes, not weeks.",
  },
  {
    icon: TrendingUp,
    title: "Retroactive commission engine",
    desc: "Tiered rates that recalculate automatically when a partner crosses a threshold — server-side, cents-precise, fully auditable.",
  },
  {
    icon: CalendarCheck2,
    title: "In-house booking calendar",
    desc: "Time-zone aware scheduling, reminders, reschedules, and ICS invites — no dependency on a third-party calendar tool.",
  },
  {
    icon: Mail,
    title: "Automated client nurture",
    desc: "Five-stage lifecycle email sequences that cancel themselves the moment a client moves stages — never a stale send.",
  },
  {
    icon: Trophy,
    title: "Live leaderboard",
    desc: "Opt-in partner rankings that drive competitive urgency, refreshed automatically, safe from gaming.",
  },
  {
    icon: Webhook,
    title: "Open integration layer",
    desc: "Signed outbound webhooks for every event — connect Zapier, Slack, your CRM, or anything that speaks HTTP.",
  },
  {
    icon: Palette,
    title: "White-label branding",
    desc: "Your logo, your colors, your sender domain — on every partner-facing and client-facing page. Nobody sees us.",
  },
  {
    icon: ShieldCheck,
    title: "Audit-logged & secure",
    desc: "Every state change, every email, every payout is logged. Row-level tenant isolation at the database layer.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$297",
    period: "/mo",
    blurb: "For companies just standing up a referral program.",
    features: ["Up to 50 partners", "In-house calendar & nurture", "Commission engine", "Email support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$797",
    period: "/mo",
    blurb: "For growing referral programs that need white-label polish.",
    features: [
      "Up to 250 partners",
      "Everything in Starter",
      "Full white-label branding",
      "Live leaderboard",
      "Webhook integrations",
      "Priority support",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    blurb: "For established programs with high partner volume.",
    features: ["Unlimited partners", "Everything in Pro", "Dedicated support", "Custom domain"],
    cta: "Talk to Us",
    highlighted: false,
  },
];

export default function PlatformPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/platform" className="flex items-center gap-2">
            <Image src="/logo.png" alt="YourCreditPartner" width={160} height={40} className="h-8 w-auto" />
            <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Platform
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-[13px] font-medium text-ink-muted hover:text-ink">
              Features
            </a>
            <a href="#pricing" className="text-[13px] font-medium text-ink-muted hover:text-ink">
              Pricing
            </a>
          </nav>
          <Link
            href="/platform/get-started"
            className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-20 text-center lg:px-8">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2">
            <span className="text-[12px] font-semibold tracking-wide text-emerald-700 uppercase">
              Built for credit-repair companies
            </span>
          </div>
          <h1 className="mt-8 text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">
            Run your own <span className="text-gradient-brand">partner referral engine.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,1.8vw,1.15rem)] leading-[1.8] text-ink-muted">
            YourCreditPartner is the software that powers Opulent Credit Consulting&rsquo;s own affiliate
            business — now available for other credit-repair companies to run under their own brand.
            Onboarding, attribution, booking, commissions, nurture, and payouts, owned end to end.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/platform/get-started"
              className="inline-flex items-center justify-center rounded-full px-10 py-4 text-[16px] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
            >
              Start Your Free Setup
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-medium text-ink-muted transition-all duration-300 hover:bg-black/[0.03] hover:text-ink"
            >
              See Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-black/[0.06] bg-surface-soft py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600/60">
              Everything included
            </p>
            <h2 className="mt-4 text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight text-ink">
              One platform. Every part of the funnel.
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-black/[0.06] bg-white p-6 transition-all duration-300 hover:shadow-lg hover:border-brand-200"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50">
                    <Icon className="size-5 text-brand-600" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-bold text-ink">{f.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600/60">Pricing</p>
            <h2 className="mt-4 text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight text-ink">
              Simple, capacity-based plans.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">
              Every plan includes the full platform — calendar, commissions, nurture, leaderboard,
              integrations. Plans scale by partner capacity, not feature gates.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border p-8 transition-all duration-300 ${
                  p.highlighted
                    ? "border-brand-300 bg-white shadow-xl scale-[1.02]"
                    : "border-black/[0.06] bg-white hover:shadow-md"
                }`}
              >
                {p.highlighted && (
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    Most Popular
                  </span>
                )}
                <h3 className="mt-3 text-lg font-bold text-ink">{p.name}</h3>
                <p className="mt-1 text-sm text-ink-muted">{p.blurb}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-ink">{p.price}</span>
                  <span className="text-sm text-ink-muted">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-ink-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/platform/get-started"
                  className={`mt-8 block rounded-full px-6 py-3 text-center text-sm font-semibold transition-all duration-300 ${
                    p.highlighted
                      ? "text-white hover:shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                      : "border border-black/[0.08] text-ink hover:bg-surface-soft"
                  }`}
                  style={p.highlighted ? { background: "linear-gradient(135deg, #4F46E5, #7C3AED)" } : undefined}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-black/[0.06] bg-surface-soft py-20">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-extrabold tracking-tight text-ink">
            Ready to run your own referral engine?
          </h2>
          <p className="mt-4 text-[15px] text-ink-muted">
            Set up your branded instance in minutes. No credit card required to get started.
          </p>
          <Link
            href="/platform/get-started"
            className="mt-8 inline-flex items-center justify-center rounded-full px-10 py-4 text-[16px] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/[0.06] py-10">
        <div className="mx-auto max-w-6xl px-6 text-center text-[12px] text-ink-muted/60 lg:px-8">
          &copy; {new Date().getFullYear()} YourCreditPartner. Built by Opulent Credit Consulting.
        </div>
      </footer>
    </div>
  );
}
