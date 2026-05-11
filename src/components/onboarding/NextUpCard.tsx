import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import type { FastStartVideo } from "@/types/database";

interface Props {
  nextVideo: FastStartVideo | null;
  allDone: boolean;
}

export function NextUpCard({ nextVideo, allDone }: Props) {
  if (allDone) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-success/30 bg-success/5 p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/20">
          <Trophy className="size-5 text-success" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">
            Fast Start complete!
          </p>
          <p className="text-xs text-ink-muted">
            You&rsquo;ve watched all required videos.
          </p>
        </div>
        <Link
          href="/onboarding/complete"
          className="shrink-0 rounded-lg bg-success px-4 py-2 text-xs font-semibold text-white"
        >
          Finish
        </Link>
      </div>
    );
  }

  if (!nextVideo) return null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex-1">
        <p className="text-xs font-medium text-ink-muted">Up next</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{nextVideo.title}</p>
      </div>
      <Link
        href={`/onboarding/fast-start/${nextVideo.slug}`}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-500"
      >
        Watch <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
