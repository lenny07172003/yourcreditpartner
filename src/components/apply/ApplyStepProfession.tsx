const PROFESSIONS = [
  { slug: "mlo", icon: "🏠", label: "Mortgage Loan Officer", tagline: "Buyers denied or borderline" },
  { slug: "realtor", icon: "🔑", label: "Realtor", tagline: "Failed pre-approvals" },
  { slug: "solar", icon: "☀️", label: "Solar Rep", tagline: "Financing declines" },
  { slug: "fi", icon: "🚗", label: "F&I Manager (Auto)", tagline: "Subprime buyers" },
  { slug: "dealership", icon: "🚗", label: "Independent Dealership", tagline: "Walk-away buyers" },
  { slug: "insurance", icon: "🛡️", label: "Insurance Agent", tagline: "Credit affects premiums" },
  { slug: "tax", icon: "🧮", label: "Tax Pro / CPA", tagline: "Sees client debt firsthand" },
  { slug: "advisor", icon: "📈", label: "Financial Advisor", tagline: "Wealth plan blocked by score" },
  { slug: "investor", icon: "🏘️", label: "Real Estate Investor", tagline: "Tenant screening pipeline" },
  { slug: "contractor", icon: "🏗️", label: "Roofer / Contractor", tagline: "Financing-dependent jobs" },
  { slug: "pi-attorney", icon: "⚖️", label: "Personal Injury Attorney", tagline: "Post-settlement clients" },
  { slug: "hr-benefits", icon: "👥", label: "HR / Benefits Broker", tagline: "Employee financial wellness" },
  { slug: "coach", icon: "🚀", label: "Business Coach", tagline: "Funding-dependent clients" },
  { slug: "property-mgr", icon: "🏢", label: "Property Manager", tagline: "Failed tenant screenings" },
  { slug: "bk-attorney", icon: "🏛️", label: "Bankruptcy Attorney", tagline: "Post-discharge rebuild" },
  { slug: "individual", icon: "👤", label: "Individual Referrer", tagline: "Friends, family, clients" },
];

interface Props {
  value: string;
  onChange: (slug: string) => void;
  onNext: () => void;
}

export function ApplyStepProfession({ value, onChange, onNext }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">What best describes you?</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Select the option that fits your profession. This helps us tailor your onboarding.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PROFESSIONS.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => onChange(p.slug)}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
              value === p.slug
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                : "border-line bg-surface hover:border-brand-300"
            }`}
          >
            <span className="text-xl">{p.icon}</span>
            <div>
              <p className="text-sm font-semibold text-ink">{p.label}</p>
              <p className="text-xs text-ink-muted">{p.tagline}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!value}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
