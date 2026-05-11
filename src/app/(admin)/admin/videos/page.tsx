"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X, ExternalLink } from "lucide-react";
import type { FastStartVideo } from "@/types/database";

const TRACK_LABELS: Record<string, string> = {
  core: "Core",
  mlo: "MLO",
  realtor: "Realtor",
  solar: "Solar",
  auto: "Auto",
  contractor: "Contractor",
  individual: "Individual",
};

function TrackBadge({ track }: { track: string }) {
  return (
    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
      {TRACK_LABELS[track] ?? track}
    </span>
  );
}

function VideoRow({
  video,
  onSave,
}: {
  video: FastStartVideo;
  onSave: (id: string, updates: Partial<FastStartVideo>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(video.video_url ?? "");
  const [duration, setDuration] = useState(
    video.duration_seconds?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(video.id, {
      video_url: url.trim() || null,
      duration_seconds: duration ? parseInt(duration) : null,
    });
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setUrl(video.video_url ?? "");
    setDuration(video.duration_seconds?.toString() ?? "");
    setEditing(false);
  }

  const hasUrl = !!video.video_url;

  return (
    <tr className="border-t border-line">
      <td className="px-4 py-3 text-sm text-ink-muted">{video.sort_order}</td>

      <td className="px-4 py-3">
        <p className="text-sm font-medium text-ink">{video.title}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {video.tracks.map((t) => (
            <TrackBadge key={t} track={t} />
          ))}
          {video.required && (
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
              Required
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            hasUrl ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${hasUrl ? "bg-success" : "bg-warning"}`}
          />
          {hasUrl ? "Live" : "Pending"}
        </span>
      </td>

      <td className="px-4 py-3">
        {editing ? (
          <div className="space-y-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://vimeo.com/... or YouTube URL"
              className="w-full rounded-lg border border-line px-3 py-1.5 text-xs text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration (seconds)"
              className="w-36 rounded-lg border border-line px-3 py-1.5 text-xs text-ink outline-none focus:border-brand-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                <Check className="size-3" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
              >
                <X className="size-3" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {video.video_url ? (
              <a
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                <ExternalLink className="size-3" />
                View
              </a>
            ) : (
              <span className="text-xs text-ink-muted">No URL</span>
            )}
            {video.duration_seconds && (
              <span className="text-xs text-ink-muted">
                {Math.floor(video.duration_seconds / 60)}m {video.duration_seconds % 60}s
              </span>
            )}
            <button
              onClick={() => setEditing(true)}
              className="ml-auto flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted hover:border-brand-400 hover:text-brand-600"
            >
              <Pencil className="size-3" />
              Edit
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<FastStartVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/videos")
      .then((r) => r.json())
      .then((d) => {
        setVideos(d.videos ?? []);
        setLoading(false);
      });
  }, []);

  async function handleSave(id: string, updates: Partial<FastStartVideo>) {
    const res = await fetch("/api/admin/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const { video } = await res.json();
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...video } : v))
      );
    }
  }

  const liveCount = videos.filter((v) => v.video_url).length;

  return (
    <div className="min-h-screen bg-surface-soft p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">Fast Start Videos</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Set video URLs for each training video. Partners see a placeholder
              until a URL is added.
            </p>
          </div>
          {!loading && (
            <span className="text-sm text-ink-muted">
              {liveCount}/{videos.length} live
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-sm text-ink-muted">
              Loading…
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Title / Tracks</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">URL / Duration</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <VideoRow key={v.id} video={v} onSave={handleSave} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-3 text-xs text-ink-muted">
          Supports YouTube, Vimeo, Wistia, and direct .mp4 URLs.
        </p>
      </div>
    </div>
  );
}
