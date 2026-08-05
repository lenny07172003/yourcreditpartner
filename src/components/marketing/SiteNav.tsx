"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Who It's For", href: "#partner-types" },
  { label: "Earnings", href: "#calculator" },
  { label: "FAQ", href: "#faq" },
];

export function SiteNav({ dashboardHref }: { dashboardHref: string | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-4 left-4 right-4 z-50 transition-all duration-500">
      <div
        className={cn(
          "mx-auto max-w-7xl overflow-hidden rounded-2xl transition-all duration-500",
          scrolled
            ? "bg-white/80 backdrop-blur-2xl border border-black/[0.04] shadow-[0_1px_30px_rgba(0,0,0,0.08)]"
            : "bg-transparent border border-transparent"
        )}
      >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="YourCreditPartner" width={1300} height={300} className="h-14 w-auto" priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative px-4 py-2 text-[13px] font-medium text-ink-muted transition-all duration-300 hover:text-ink rounded-full hover:bg-black/[0.03]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          {dashboardHref ? (
            <Link
              href={dashboardHref}
              className="rounded-full px-6 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-5 py-2 text-[13px] font-medium text-ink-muted transition-all duration-300 hover:text-ink"
              >
                Sign In
              </Link>
              <Link
                href="/apply"
                className="rounded-full px-6 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="text-ink-muted md:hidden p-2 rounded-xl hover:bg-black/[0.04] transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden transition-all duration-300 overflow-hidden",
          open ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="bg-white/95 backdrop-blur-2xl border-t border-black/[0.04] px-6 py-6">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-xl px-4 py-3 text-[15px] font-medium text-ink-muted hover:bg-black/[0.03] hover:text-ink transition-all"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3 border-t border-black/[0.06] pt-4">
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                className="rounded-xl py-3 text-center text-[15px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                onClick={() => setOpen(false)}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-xl px-4 py-3 text-center text-[15px] font-medium text-ink-muted hover:bg-black/[0.03]"
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/apply"
                  className="rounded-xl py-3 text-center text-[15px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </header>
  );
}
