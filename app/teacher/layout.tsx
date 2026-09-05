import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "teacher") redirect("/admin");

  return (
    <div className="flex min-h-screen">
      <Sidebar role="teacher" userName={session.user?.name ?? "Teacher"} />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
