interface Props {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-ink">
          {completed} of {total} videos completed
        </span>
        <span className="text-ink-muted">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
