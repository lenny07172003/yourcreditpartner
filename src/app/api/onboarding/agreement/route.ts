import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const AgreementSchema = z.object({
  signatureName: z.string().trim().min(2).max(200),
  agreed: z.literal(true),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = AgreementSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete the agreement before continuing." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: partner } = await admin
    .from("partners")
    .select("id, agreement_signed_at")
    .eq("email", user.email!.toLowerCase())
    .maybeSingle();

  if (!partner) {
    return NextResponse.json({ error: "No partner account found for this user." }, { status: 404 });
  }

  if (partner.agreement_signed_at) {
    return NextResponse.json({ success: true, alreadySigned: true });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const { error } = await admin
    .from("partners")
    .update({
      agreement_signed_at: new Date().toISOString(),
      agreement_ip: ip,
      agreement_user_agent: userAgent,
      agreement_version: "v1.0",
      agreement_signature_name: parsed.data.signatureName,
    })
    .eq("id", partner.id);

  if (error) {
    console.error("[onboarding/agreement] update error:", error);
    return NextResponse.json({ error: "Could not save your signature. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
