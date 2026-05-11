"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplyStepProfession } from "@/components/apply/ApplyStepProfession";
import { ApplyStepDetails } from "@/components/apply/ApplyStepDetails";
import { ApplyStepWhy } from "@/components/apply/ApplyStepWhy";
import { ApplyStepAgreement } from "@/components/apply/ApplyStepAgreement";

const STEPS = ["Profession", "Details", "Your Goals", "Agreement"];

interface FormData {
  partnerType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  stateOfOperation: string;
  whyPartnering: string;
  expectedVolume: string;
  signatureName: string;
  agreed: boolean;
}

const INITIAL: FormData = {
  partnerType: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  stateOfOperation: "",
  whyPartnering: "",
  expectedVolume: "",
  signatureName: "",
  agreed: false,
};

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(data: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...data }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerType: form.partnerType,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          companyName: form.companyName || undefined,
          stateOfOperation: form.stateOfOperation || undefined,
          whyPartnering: form.whyPartnering || undefined,
          expectedVolume: form.expectedVolume || undefined,
          signatureName: form.signatureName,
          agreedToTerms: form.agreed,
          agreementUserAgent: navigator.userAgent,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/apply/success?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-soft py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink">Apply to Partner</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Free to join · Takes about 2 minutes
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < step
                    ? "bg-brand-600 text-white"
                    : i === step
                    ? "border-2 border-brand-600 text-brand-600"
                    : "border-2 border-line text-ink-muted"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  i === step ? "text-brand-600" : "text-ink-muted"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 ${i < step ? "bg-brand-600" : "bg-line"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          {step === 0 && (
            <ApplyStepProfession
              value={form.partnerType}
              onChange={(v) => update({ partnerType: v })}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <ApplyStepDetails
              value={{
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                companyName: form.companyName,
                stateOfOperation: form.stateOfOperation,
              }}
              onChange={update}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <ApplyStepWhy
              value={{
                whyPartnering: form.whyPartnering,
                expectedVolume: form.expectedVolume,
              }}
              onChange={update}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <ApplyStepAgreement
              firstName={form.firstName}
              lastName={form.lastName}
              signatureName={form.signatureName}
              onSignatureChange={(v) => update({ signatureName: v })}
              agreed={form.agreed}
              onAgreedChange={(v) => update({ agreed: v })}
              onSubmit={handleSubmit}
              onBack={() => setStep(2)}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
