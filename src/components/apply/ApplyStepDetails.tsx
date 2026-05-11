const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

interface DetailsData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  stateOfOperation: string;
}

interface Props {
  value: DetailsData;
  onChange: (data: Partial<DetailsData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-ink-muted/50";

export function ApplyStepDetails({ value, onChange, onNext, onBack }: Props) {
  const isValid =
    value.firstName.trim() &&
    value.lastName.trim() &&
    value.email.trim() &&
    value.phone.trim();

  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Your details</h2>
      <p className="mt-1 text-sm text-ink-muted">
        This is how we'll set up your partner account.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="First name" required>
          <input
            type="text"
            className={inputClass}
            placeholder="Jane"
            value={value.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
          />
        </Field>

        <Field label="Last name" required>
          <input
            type="text"
            className={inputClass}
            placeholder="Smith"
            value={value.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
          />
        </Field>

        <Field label="Email address" required>
          <input
            type="email"
            className={inputClass}
            placeholder="jane@example.com"
            value={value.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </Field>

        <Field label="Phone number" required>
          <input
            type="tel"
            className={inputClass}
            placeholder="(555) 000-0000"
            value={value.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </Field>

        <Field label="Company / Brokerage">
          <input
            type="text"
            className={inputClass}
            placeholder="Optional"
            value={value.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
          />
        </Field>

        <Field label="State of operation">
          <select
            className={inputClass}
            value={value.stateOfOperation}
            onChange={(e) => onChange({ stateOfOperation: e.target.value })}
          >
            <option value="">Select state</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
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
          disabled={!isValid}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
