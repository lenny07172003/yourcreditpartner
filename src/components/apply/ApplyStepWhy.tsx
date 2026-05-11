const VOLUME_OPTIONS = [
  { value: "1-3", label: "1–3 per month", sub: "Just getting started" },
  { value: "4-10", label: "4–10 per month", sub: "Active pipeline" },
  { value: "11-25", label: "11–25 per month", sub: "High volume" },
  { value: "25+", label: "25+ per month", sub: "Enterprise / team" },
];

interface WhyData {
  whyPartnering: string;
  expectedVolume: string;
}

interface Props {
  value: WhyData;
  onChange: (data: Partial<WhyData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ApplyStepWhy({ value, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">A bit more about you</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Helps us understand your referral pipeline.
      </p>

      <div className="mt-6 space-y-6">
        {/* Why */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink">
            Why are you interested in partnering? (optional)
          </label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-ink-muted/50"
            placeholder="e.g. I frequently work with buyers who get denied for credit — instead of losing those leads I'd like to refer them..."
            value={value.whyPartnering}
            onChange={(e) => onChange({ whyPartnering: e.target.value })}
          />
        </div>

        {/* Volume */}
        <div>
          <label className="mb-3 block text-xs font-medium text-ink">
            How many referrals do you expect to submit per month?
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {VOLUME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ expectedVolume: opt.value })}
                className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                  value.expectedVolume === opt.value
                    ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                    : "border-line bg-surface hover:border-brand-300"
                }`}
              >
                <span className="text-sm font-semibold text-ink">
                  {opt.label}
                </span>
                <span className="mt-0.5 text-xs text-ink-muted">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-ink-muted hover:text-ink"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
