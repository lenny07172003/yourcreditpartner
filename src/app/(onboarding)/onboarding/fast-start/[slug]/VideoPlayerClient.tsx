"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/onboarding/VideoPlayer";

interface Props {
  videoId: string;
  partnerId: string;
  url: string | null;
  startPosition: number;
  alreadyCompleted: boolean;
  willCompleteAll: boolean;
}

export function VideoPlayerClient({
  videoId,
  partnerId,
  url,
  startPosition,
  alreadyCompleted,
  willCompleteAll,
}: Props) {
  const router = useRouter();
  const started = useRef(false);

  const postProgress = useCallback(
    async (action: "start" | "complete" | "progress", positionSeconds?: number) => {
      await fetch("/api/partner/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, action, positionSeconds }),
      });
    },
    [videoId]
  );

  function handleStart() {
    if (started.current) return;
    started.current = true;
    postProgress("start");
  }

  async function handleEnded() {
    await postProgress("complete");
    if (willCompleteAll) {
      router.push("/onboarding/complete");
    } else {
      router.refresh();
    }
  }

  function handleProgress(seconds: number) {
    postProgress("progress", seconds);
  }

  return (
    <VideoPlayer
      url={url}
      startPosition={startPosition}
      onStart={handleStart}
      onEnded={alreadyCompleted ? undefined : handleEnded}
      onProgress={handleProgress}
    />
  );
}
