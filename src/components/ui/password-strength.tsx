"use client";

import { cn } from "@/lib/utils";

function getStrength(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { level: score, label: labels[score] };
}

const SEGMENT_COLORS = [
  "",
  "bg-red-500",
  "bg-amber-500",
  "bg-brand-500",
  "bg-emerald-500",
];

const LABEL_COLORS = [
  "",
  "text-red-600",
  "text-amber-600",
  "text-brand-600",
  "text-emerald-600",
];

export function PasswordStrength({ password }: { password: string }) {
  const { level, label } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i <= level ? SEGMENT_COLORS[level] : "bg-surface-raised"
            )}
          />
        ))}
      </div>
      {label && (
        <p className={cn("text-xs font-medium", LABEL_COLORS[level])}>
          {label}
        </p>
      )}
    </div>
  );
}
