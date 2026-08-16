import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/supabase/requirePlatformAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTenantOrg } from "@/lib/org/createTenant";

const AddCompanySchema = z.object({
  companyName: z.string().trim().min(2).max(150),
  adminEmail: z.string().email(),
  plan: z.enum(["starter", "pro", "enterprise"]).optional(),
});

export async function POST(req: NextRequest) {
  const deny = await requirePlatformAdmin();
  if (deny) return deny;

  const parsed = AddCompanySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid company data.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  try {
    const org = await createTenantOrg(admin, {
      companyName: parsed.data.companyName,
      adminEmail: parsed.data.adminEmail,
      plan: parsed.data.plan,
      kind: "company",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    await admin.auth.admin.inviteUserByEmail(parsed.data.adminEmail.toLowerCase(), {
      redirectTo: `${appUrl}/auth/callback`,
    });

    return NextResponse.json({ success: true, orgId: org.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create company.";
    console.error("[super-admin/companies] error:", err);
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
