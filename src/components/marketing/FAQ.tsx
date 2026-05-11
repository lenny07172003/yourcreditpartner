"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "How much can I realistically earn?", a: "Partners earn 15-35% of net revenue per closed client. At the Starter tier (1-9 closes/month), that's 15%. Hit 10 closes and you unlock Producer at 20% — retroactive on every close that month. On average net revenue of $1,200 per client, that's $180-$420 per close." },
  { q: "When and how do I get paid?", a: "Commissions are earned after a client's payment clears the 30-day refund window. Payouts are batched and sent monthly via Zelle. There's no minimum payout threshold — if you've earned it, you get it." },
  { q: "Do I have to sell anything?", a: "No. You refer. We sell. We handle the consultation, the pitch, the service delivery, the follow-up, and all client communication. Your only job is pointing us at the right people." },
  { q: "What happens to my client during repair?", a: "We give every referral a free credit consultation. If they sign up, our team handles everything — disputes, monitoring, bureau communication, and progress updates. Most clients see meaningful improvement in 60-90 days. They come back to you qualified and ready to close." },
  { q: "Is there any cost to join?", a: "Zero. The partner program is completely free to join and participate in. No monthly fees, no setup costs, no hidden charges. We make money when clients close — so we're fully aligned with your success." },
  { q: "Can I refer a colleague to also become a partner?", a: "Yes. You earn 5% of every commission your referred partners generate — for as long as you're both active. It's passive income on top of your own referrals. You get a unique partner invite link in your dashboard." },
  { q: "What if my referral doesn't close?", a: "No penalty. You only earn on closed, paid clients. We'll work hard to close every referral because we both win when they do — but there's zero risk to you." },
  { q: "How long does credit repair take?", a: "Most clients see meaningful movement in 60-90 days. Some items resolve faster. Every client gets an honest assessment on their free consultation so they know exactly what to expect." },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-surface-soft border-t border-black/[0.06]">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-28">
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-brand-600/60">FAQ</p>
          <h2 className="mt-4 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-ink">
            Questions? Answered.
          </h2>
        </div>

        <div className="mt-14 space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-black/[0.06] bg-white transition-all duration-300 hover:border-brand-200"
              >
                <button
                  className="flex w-full items-center justify-between px-7 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-[14px] font-semibold text-ink pr-4">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "size-5 flex-none text-ink-muted/40 transition-transform duration-300",
                      isOpen && "rotate-180 text-brand-600"
                    )}
                  />
                </button>
                <div className={cn(
                  "overflow-hidden transition-all duration-300",
                  isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                )}>
                  <div className="px-7 pb-6">
                    <p className="text-[14px] leading-[1.8] text-ink-muted">{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
