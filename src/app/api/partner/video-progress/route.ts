import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerByAuthId, getVideosForPartnerType, getVideoProgress } from "@/lib/supabase/queries";

const ProgressSchema = z.object({
  videoId: z.string().uuid(),
  action: z.enum(["start", "complete", "progress"]),
  positionSeconds: z.number().int().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProgressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { videoId, action, positionSeconds } = parsed.data;

    const partner = await getPartnerByAuthId(supabase, user.id);
    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const admin = createAdminClient();

    // Fetch existing progress row
    const { data: existing } = await admin
      .from("partner_video_progress")
      .select("*")
      .eq("org_id", partner.org_id)
      .eq("partner_id", partner.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (action === "start") {
      if (existing) {
        // Already started — just update position if provided
        if (positionSeconds !== undefined) {
          await admin
            .from("partner_video_progress")
            .update({ last_position_seconds: positionSeconds })
            .eq("org_id", partner.org_id)
            .eq("id", existing.id);
        }
      } else {
        await admin.from("partner_video_progress").insert({
          org_id: partner.org_id,
          partner_id: partner.id,
          video_id: videoId,
          started_at: new Date().toISOString(),
          last_position_seconds: 0,
        });
      }
    } else if (action === "complete") {
      if (existing) {
        await admin
          .from("partner_video_progress")
          .update({
            completed_at: existing.completed_at ?? new Date().toISOString(),
            last_position_seconds: positionSeconds ?? existing.last_position_seconds,
          })
          .eq("org_id", partner.org_id)
          .eq("id", existing.id);
      } else {
        await admin.from("partner_video_progress").insert({
          org_id: partner.org_id,
          partner_id: partner.id,
          video_id: videoId,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          last_position_seconds: positionSeconds ?? 0,
        });
      }

      // Check if all required videos are now complete → mark fast_start_completed
      if (!partner.fast_start_completed_at) {
        const [videos, allProgress] = await Promise.all([
          getVideosForPartnerType(supabase, partner.partner_type, partner.org_id),
          getVideoProgress(supabase, partner.id, partner.org_id),
        ]);

        const required = videos.filter((v) => v.required);
        const progressMap = new Map(allProgress.map((p) => [p.video_id, p]));

        const allDone = required.every(
          (v) =>
            v.id === videoId || // just completed this one
            !!progressMap.get(v.id)?.completed_at
        );

        if (allDone) {
          await admin
            .from("partners")
            .update({ fast_start_completed_at: new Date().toISOString() })
            .eq("org_id", partner.org_id)
            .eq("id", partner.id);
        }
      }
    } else if (action === "progress") {
      if (positionSeconds === undefined) {
        return NextResponse.json({ error: "positionSeconds required" }, { status: 400 });
      }
      if (existing) {
        await admin
          .from("partner_video_progress")
          .update({ last_position_seconds: positionSeconds })
          .eq("org_id", partner.org_id)
          .eq("id", existing.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[video-progress]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
