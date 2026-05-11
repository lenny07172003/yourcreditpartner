import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("fast_start_videos")
    .select("*")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ videos: data });
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  video_url: z.string().url().nullable(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  duration_seconds: z.number().int().positive().nullable().optional(),
  cta_label: z.string().max(100).nullable().optional(),
  cta_url: z.string().url().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("fast_start_videos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ video: data });
}
