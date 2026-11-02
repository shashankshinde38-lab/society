"use server";

import { cookies } from "next/headers";

export async function setAdminSession(email: string = "admin@gmail.com") {
  const cookieStore = await cookies();
  cookieStore.set("society_admin_session", email, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  });
  return { success: true };
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete("society_admin_session");
  return { success: true };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get("society_admin_session")?.value || null;
}
