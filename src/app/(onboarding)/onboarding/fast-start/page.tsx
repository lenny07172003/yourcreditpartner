import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getPartnerByAuthId,
  getVideosForPartnerType,
  getVideoProgress,
} from "@/lib/supabase/queries";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { VideoCard } from "@/components/onboarding/VideoCard";

export default async function FastStartPage() {
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

  const progressMap = new Map(progress.map((p) => [p.video_id, p]));
  const requiredVideos = videos.filter((v) => v.required);
  const completedRequired = requiredVideos.filter((v) =>
    progressMap.get(v.id)?.completed_at
  );

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Top bar */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-base font-bold text-ink">Fast Start Training</h1>
            <p className="text-xs text-ink-muted">
              Welcome, {partner.first_name}. Watch the videos below to get set up.
            </p>
          </div>
          <form action="/api/partner/skip-fast-start" method="POST">
            <button
              type="submit"
              className="text-xs text-ink-muted hover:text-ink"
            >
              Skip for now →
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Progress */}
        <ProgressBar
          completed={completedRequired.length}
          total={requiredVideos.length}
        />

        {/* Video list */}
        <div className="mt-8 space-y-3">
          {videos.map((video, i) => (
            <VideoCard
              key={video.id}
              video={video}
              progress={progressMap.get(video.id)}
              index={i}
            />
          ))}
        </div>

        {/* All done CTA */}
        {completedRequired.length === requiredVideos.length && requiredVideos.length > 0 && (
          <div className="mt-8 rounded-xl border border-success/30 bg-success/5 p-6 text-center">
            <p className="text-base font-semibold text-ink">
              🎉 You&rsquo;ve completed Fast Start!
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              You&rsquo;re ready to start referring clients.
            </p>
            <Link
              href="/onboarding/complete"
              className="mt-4 inline-block rounded-lg bg-success px-6 py-2.5 text-sm font-semibold text-white"
            >
              Go to your dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
