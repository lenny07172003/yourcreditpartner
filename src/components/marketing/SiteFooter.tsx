import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/[0.06] bg-surface-soft">
      <div className="mx-auto max-w-6xl px-6 lg:px-8 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Image src="/logo.png" alt="YourCreditPartner" width={180} height={45} className="h-9 w-auto" />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-muted">
              Empowering your financial future. Earn up to 35% commissions by
              referring credit repair clients.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted/50">Program</p>
            <ul className="mt-4 space-y-3">
              {[
                { label: "How It Works", href: "#how-it-works" },
                { label: "Who It's For", href: "#partner-types" },
                { label: "Earnings Calculator", href: "#calculator" },
                { label: "FAQ", href: "#faq" },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-[13px] text-ink-muted transition-colors hover:text-ink">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted/50">Partners</p>
            <ul className="mt-4 space-y-3">
              {[
                { label: "Apply Now", href: "/apply" },
                { label: "Partner Login", href: "/auth/login" },
                { label: "Partner Dashboard", href: "/dashboard" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-ink-muted transition-colors hover:text-ink">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted/50">Legal</p>
            <ul className="mt-4 space-y-3">
              {[
                { label: "Affiliate Agreement", href: "/affiliate-agreement" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-ink-muted transition-colors hover:text-ink">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-black/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-ink-muted/50">
            &copy; {new Date().getFullYear()} Opulent Credit Consulting LLC. All rights reserved.
          </p>
          <p className="text-[12px] text-ink-muted/30">
            Powered by YourCreditPartner
          </p>
        </div>
      </div>
    </footer>
  );
}
