import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPartnerByAuthId } from "@/lib/supabase/queries";
import { OCG_ORG_ID } from "@/lib/org/context";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const partner = await getPartnerByAuthId(supabase, user.id, OCG_ORG_ID);
    if (partner) redirect("/dashboard");

    const admin = createAdminClient();
    const { data: adminUser } = await admin
      .from("admin_users")
      .select("id")
      .eq("email", user.email!.toLowerCase())
      .maybeSingle();
    if (adminUser) redirect("/admin");
  }

  return <LoginForm />;
}
