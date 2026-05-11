import Link from "next/link";
import { CheckCircle, Circle, Clock } from "lucide-react";
import type { FastStartVideo, PartnerVideoProgress } from "@/types/database";

interface Props {
  video: FastStartVideo;
  progress: PartnerVideoProgress | undefined;
  index: number;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoCard({ video, progress, index }: Props) {
  const completed = !!progress?.completed_at;
  const started = !!progress?.started_at && !completed;

  return (
    <Link
      href={`/onboarding/fast-start/${video.slug}`}
      className={`flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-sm ${
        completed
          ? "border-success/30 bg-success/5"
          : started
          ? "border-brand-300 bg-brand-50"
          : "border-line bg-surface hover:border-brand-300"
      }`}
    >
      {/* Status icon */}
      <div className="mt-0.5 shrink-0">
        {completed ? (
          <CheckCircle className="size-5 text-success" />
        ) : started ? (
          <Circle className="size-5 text-brand-500" />
        ) : (
          <Circle className="size-5 text-line" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${completed ? "text-ink-muted line-through" : "text-ink"}`}>
            {index + 1}. {video.title}
          </p>
          {video.required && !completed && (
            <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              Required
            </span>
          )}
        </div>

        {video.description && (
          <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
            {video.description}
          </p>
        )}

        {video.duration_seconds && (
          <div className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
            <Clock className="size-3" />
            {formatDuration(video.duration_seconds)}
          </div>
        )}

        {completed && (
          <p className="mt-1 text-xs text-success">Completed</p>
        )}
        {started && !completed && (
          <p className="mt-1 text-xs text-brand-600">In progress</p>
        )}
      </div>
    </Link>
  );
}
