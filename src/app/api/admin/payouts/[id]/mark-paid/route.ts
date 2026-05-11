import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Props) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("payouts")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "queued");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
