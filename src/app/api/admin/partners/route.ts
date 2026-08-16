import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgIdFromUser } from "@/lib/org/context";
import { createPartnerInvite, SeatLimitExceededError } from "@/lib/partners/createPartnerInvite";

const AddPartnerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().email(),
  phone: z.string().trim().min(7).max(30),
  partnerType: z.string().min(1),
});

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  return NextResponse.json({ status: "ok" });
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const parsed = AddPartnerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid partner data.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const orgId = getOrgIdFromUser(user);

  const admin = createAdminClient();

  try {
    const partner = await createPartnerInvite(admin, { orgId, ...parsed.data });
    return NextResponse.json({ success: true, partnerId: partner.id }, { status: 201 });
  } catch (err) {
    if (err instanceof SeatLimitExceededError) {
      return NextResponse.json(
        { error: err.message, seatLimitExceeded: true, used: err.used, limit: err.limit },
        { status: 403 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to add partner.";
    console.error("[admin/partners] create error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
