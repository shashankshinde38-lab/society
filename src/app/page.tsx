import { redirect } from "next/navigation";
import { getVerifiedSession } from "@/features/auth/authActions";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const { authenticated } = await getVerifiedSession();

  if (authenticated) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
