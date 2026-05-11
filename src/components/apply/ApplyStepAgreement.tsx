import { AgreementClickwrap } from "./AgreementClickwrap";

interface Props {
  firstName: string;
  lastName: string;
  signatureName: string;
  onSignatureChange: (v: string) => void;
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export function ApplyStepAgreement({
  firstName,
  lastName,
  signatureName,
  onSignatureChange,
  agreed,
  onAgreedChange,
  onSubmit,
  onBack,
  loading,
  error,
}: Props) {
  const expectedName = `${firstName} ${lastName}`.trim();
  const signatureValid = signatureName.trim().length >= 2;
  const canSubmit = agreed && signatureValid && !loading;

  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Review & sign</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Read the affiliate agreement, type your full legal name as your digital
        signature, then submit.
      </p>

      {/* Agreement scroll box */}
      <div className="mt-6 h-64 overflow-y-auto rounded-xl border border-line bg-surface-soft p-5 text-sm leading-relaxed">
        <AgreementClickwrap />
      </div>

      {/* Signature block */}
      <div className="mt-5 space-y-4 rounded-xl border border-line bg-surface p-5">
        {/* Typed signature input */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink">
            Type your full legal name as your digital signature{" "}
            <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={signatureName}
            onChange={(e) => onSignatureChange(e.target.value)}
            placeholder={expectedName || "Your full name"}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          {/* Signature preview */}
          {signatureValid && (
            <div className="mt-3 rounded-lg border border-dashed border-brand-300 bg-brand-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-brand-400">
                Digital Signature
              </p>
              <p
                className="mt-1 text-2xl text-ink"
                style={{ fontFamily: "cursive" }}
              >
                {signatureName}
              </p>
              <p className="mt-1 text-[10px] text-ink-muted">
                Signed on {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Checkbox */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-brand-600"
            checked={agreed}
            onChange={(e) => onAgreedChange(e.target.checked)}
          />
          <span className="text-sm text-ink">
            I,{" "}
            <span className="font-semibold">
              {signatureName || expectedName || "___________"}
            </span>
            , have read and agree to the YourCreditPartner Affiliate Agreement
            (v1.0). I understand I am an independent contractor and that
            commissions are earned per the terms above.
          </span>
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-ink-muted hover:text-ink disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-lg bg-brand-600 px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-40"
        >
          {loading ? "Submitting…" : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
