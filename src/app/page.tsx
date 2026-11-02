import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const localAdmin = cookieStore.get("society_admin_session")?.value;

  if (user || localAdmin) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
