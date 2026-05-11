"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function UnsubscribeForm() {
  const params = useSearchParams();
  const referralId = params.get("ref");
  const partnerId = params.get("partner");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleUnsubscribe() {
    setStatus("loading");

    const res = await fetch("/api/public/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralId, partnerId }),
    });

    setStatus(res.ok ? "done" : "error");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/">
          <img src="/logo.png" alt="YourCreditPartner" className="h-10 w-auto mx-auto" />
        </Link>

        <div className="mt-8 rounded-2xl border border-brand-800 bg-brand-900 p-8">
          {status === "done" ? (
            <>
              <h2 className="text-lg font-semibold text-white">Unsubscribed</h2>
              <p className="mt-3 text-sm text-brand-400">
                You&rsquo;ve been removed from our mailing list. You won&rsquo;t
                receive any more emails from us.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white">Unsubscribe</h2>
              <p className="mt-3 text-sm text-brand-400">
                Click below to stop receiving emails from Opulent Credit Consulting.
              </p>

              {status === "error" && (
                <p className="mt-3 text-xs text-danger">
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                onClick={handleUnsubscribe}
                disabled={status === "loading"}
                className="mt-6 w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                {status === "loading" ? "Processing..." : "Unsubscribe me"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-950" />}>
      <UnsubscribeForm />
    </Suspense>
  );
}
