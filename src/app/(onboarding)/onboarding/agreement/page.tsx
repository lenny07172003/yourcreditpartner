import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AgreementForm from "./AgreementForm";

export default async function OnboardingAgreementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: partner } = await admin
    .from("partners")
    .select("first_name, last_name, agreement_signed_at")
    .eq("email", user.email!.toLowerCase())
    .maybeSingle();

  if (!partner) redirect("/auth/login");
  if (partner.agreement_signed_at) redirect("/dashboard");

  return <AgreementForm firstName={partner.first_name} lastName={partner.last_name} />;
}
