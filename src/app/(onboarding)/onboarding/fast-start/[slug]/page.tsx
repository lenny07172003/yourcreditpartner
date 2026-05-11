import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getPartnerByAuthId,
  getVideosForPartnerType,
  getVideoProgress,
} from "@/lib/supabase/queries";
import { VideoPlayer } from "@/components/onboarding/VideoPlayer";
import { NextUpCard } from "@/components/onboarding/NextUpCard";
import { ProgressBar } from "@/components/onboarding/ProgressBar";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const partner = await getPartnerByAuthId(supabase, user.id);
  if (!partner) redirect("/auth/login");

  const [videos, progress] = await Promise.all([
    getVideosForPartnerType(supabase, partner.partner_type),
    getVideoProgress(supabase, partner.id),
  ]);

  const video = videos.find((v) => v.slug === slug);
  if (!video) notFound();

  const progressMap = new Map(progress.map((p) => [p.video_id, p]));
  const videoProgress = progressMap.get(video.id);

  const currentIndex = videos.indexOf(video);
  const nextVideo = videos[currentIndex + 1] ?? null;

  const requiredVideos = videos.filter((v) => v.required);
  const completedRequired = requiredVideos.filter(
    (v) => progressMap.get(v.id)?.completed_at
  );
  // Check if completing this video would finish all required
  const thisCompletes =
    video.required &&
    !videoProgress?.completed_at &&
    completedRequired.length === requiredVideos.length - 1;

  const allDone =
    completedRequired.length === requiredVideos.length &&
    requiredVideos.length > 0;

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Top bar */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/onboarding/fast-start"
            className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            All videos
          </Link>
          <div className="h-4 w-px bg-line" />
          <p className="text-xs text-ink-muted">
            Video {currentIndex + 1} of {videos.length}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <VideoPlayerClient
              videoId={video.id}
              partnerId={partner.id}
              url={video.video_url}
              startPosition={videoProgress?.last_position_seconds ?? 0}
              alreadyCompleted={!!videoProgress?.completed_at}
              willCompleteAll={thisCompletes || allDone}
            />

            <div className="mt-5">
              <h1 className="text-xl font-bold text-ink">{video.title}</h1>
              {video.description && (
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {video.description}
                </p>
              )}

              {video.cta_label && video.cta_url && (
                <a
                  href={video.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
                >
                  {video.cta_label}
                </a>
              )}
            </div>

            <div className="mt-6">
              <NextUpCard
                nextVideo={allDone || thisCompletes ? null : nextVideo}
                allDone={allDone || thisCompletes}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ProgressBar
              completed={completedRequired.length}
              total={requiredVideos.length}
            />
            <div className="space-y-2">
              {videos.map((v, i) => {
                const vp = progressMap.get(v.id);
                const isCurrent = v.id === video.id;
                return (
                  <Link
                    key={v.id}
                    href={`/onboarding/fast-start/${v.slug}`}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isCurrent
                        ? "bg-brand-600 text-white"
                        : vp?.completed_at
                        ? "text-ink-muted hover:bg-surface-raised"
                        : "text-ink hover:bg-surface-raised"
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        isCurrent
                          ? "bg-white/20 text-white"
                          : vp?.completed_at
                          ? "bg-success/20 text-success"
                          : "bg-surface-raised text-ink-muted"
                      }`}
                    >
                      {vp?.completed_at ? "✓" : i + 1}
                    </span>
                    <span className={`line-clamp-2 text-xs ${isCurrent ? "font-semibold" : ""}`}>
                      {v.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Client wrapper to handle video events
import { VideoPlayerClient } from "./VideoPlayerClient";
