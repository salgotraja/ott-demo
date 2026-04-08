import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { AdminNavShell } from "@/components/admin/AdminNavShell";

async function verifyAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
    await jwtVerify(token, secret);
  } catch {
    redirect("/admin/login");
  }
}

async function logoutAction() {
  "use server";
  const { cookies: getCookies } = await import("next/headers");
  (await getCookies()).delete("admin_token");
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      <AdminNavShell logout={logoutAction} />
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
