"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import { ApplyStepAgreement } from "@/components/apply/ApplyStepAgreement";

export default function AgreementForm({ firstName, lastName }: { firstName: string; lastName: string }) {
  const router = useRouter();
  const [signatureName, setSignatureName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/onboarding/agreement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signatureName, agreed }),
    });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/auth/set-password?next=/onboarding/fast-start");
  }

  async function handleBack() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Image src="/logo.png" alt="YourCreditPartner" width={160} height={40} className="mx-auto h-10 w-auto" />
          <h1 className="mt-4 text-2xl font-bold text-ink">Welcome to YourCreditPartner</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Before you get started, please review and sign your affiliate agreement.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
          <ApplyStepAgreement
            firstName={firstName}
            lastName={lastName}
            signatureName={signatureName}
            onSignatureChange={setSignatureName}
            agreed={agreed}
            onAgreedChange={setAgreed}
            onSubmit={handleSubmit}
            onBack={handleBack}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
