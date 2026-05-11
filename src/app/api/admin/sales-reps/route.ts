import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  return NextResponse.json({ status: "ok" });
}

export async function POST() {
  const deny = await requireAdmin();
  if (deny) return deny;
  return NextResponse.json({ status: "ok" });
}
