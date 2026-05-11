"use client";

import { useRef, useEffect, useCallback } from "react";
import ReactPlayer from "react-player";
import { Play } from "lucide-react";

interface Props {
  url: string | null;
  startPosition?: number;
  onStart?: () => void;
  onEnded?: () => void;
  onProgress?: (seconds: number) => void;
}

export function VideoPlayer({ url, startPosition = 0, onStart, onEnded, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  const lastReportRef = useRef(0);

  // Seek to saved position once metadata loads
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !startPosition) return;
    function onMeta() {
      if (el && startPosition) el.currentTime = startPosition;
    }
    el.addEventListener("loadedmetadata", onMeta);
    return () => el.removeEventListener("loadedmetadata", onMeta);
  }, [startPosition]);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || !onProgress) return;
    const now = Math.floor(el.currentTime);
    if (now - lastReportRef.current >= 10) {
      lastReportRef.current = now;
      onProgress(now);
    }
  }, [onProgress]);

  const handlePlay = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    onStart?.();
  }, [onStart]);

  if (!url) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl bg-brand-950 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-brand-700 bg-brand-900">
          <Play className="size-7 text-brand-500" />
        </div>
        <p className="mt-4 text-sm font-medium text-brand-400">Video coming soon</p>
        <p className="mt-1 text-xs text-brand-600">
          This training video will be available shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-black shadow-xl">
      <div className="aspect-video w-full">
        <ReactPlayer
          ref={videoRef as never}
          src={url}
          controls
          width="100%"
          height="100%"
          onPlay={handlePlay}
          onEnded={onEnded}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>
    </div>
  );
}
