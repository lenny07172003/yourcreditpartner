"use client";

import { useEffect, useState } from "react";
import { Pencil, ExternalLink, Video } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<FastStartVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<FastStartVideo | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/videos")
      .then((r) => r.json())
      .then((d) => {
        setVideos(d.videos ?? []);
        setLoading(false);
      });
  }, []);

  function openEdit(video: FastStartVideo) {
    setEditingVideo(video);
    setEditUrl(video.video_url ?? "");
    setEditDuration(video.duration_seconds?.toString() ?? "");
  }

  async function handleSave() {
    if (!editingVideo) return;
    setSaving(true);

    const res = await fetch("/api/admin/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingVideo.id,
        video_url: editUrl.trim() || null,
        duration_seconds: editDuration ? parseInt(editDuration) : null,
      }),
    });

    if (res.ok) {
      const { video } = await res.json();
      setVideos((prev) =>
        prev.map((v) => (v.id === editingVideo.id ? { ...v, ...video } : v))
      );
      toast.success(`Updated "${editingVideo.title}"`);
      setEditingVideo(null);
    } else {
      toast.error("Failed to update video");
    }
    setSaving(false);
  }

  const liveCount = videos.filter((v) => v.video_url).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
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
            Loading...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-surface-soft text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Title / Tracks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => {
                const hasUrl = !!v.video_url;
                return (
                  <tr key={v.id} className="border-t border-line hover:bg-surface-soft">
                    <td className="px-4 py-3 text-sm text-ink-muted">{v.sort_order}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-ink">{v.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {v.tracks.map((t) => (
                          <TrackBadge key={t} track={t} />
                        ))}
                        {v.required && (
                          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                            Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={hasUrl ? "live" : "draft"} label={hasUrl ? "Live" : "Pending"} />
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {v.duration_seconds
                        ? `${Math.floor(v.duration_seconds / 60)}m ${v.duration_seconds % 60}s`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {v.video_url && (
                          <a
                            href={v.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            View
                          </a>
                        )}
                        <button
                          onClick={() => openEdit(v)}
                          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted transition-colors hover:border-brand-400 hover:text-brand-600"
                        >
                          <Pencil className="size-3" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-ink-muted">
        Supports YouTube, Vimeo, Wistia, and direct .mp4 URLs.
      </p>

      {/* Edit Dialog */}
      <Dialog open={!!editingVideo} onOpenChange={(open) => !open && setEditingVideo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>
              {editingVideo?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Video URL
              </label>
              <Input
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://vimeo.com/... or YouTube URL"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Duration (seconds)
              </label>
              <Input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder="e.g. 180"
                className="max-w-[200px]"
              />
              {editDuration && (
                <p className="mt-1 text-xs text-ink-muted">
                  = {Math.floor(parseInt(editDuration) / 60)}m {parseInt(editDuration) % 60}s
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVideo(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
