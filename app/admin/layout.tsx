import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") redirect("/teacher");

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" userName={session.user?.name ?? "Admin"} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
