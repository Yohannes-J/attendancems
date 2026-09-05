import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeacherDashboardClient from "./TeacherDashboardClient";

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session) redirect("/login");
  return <TeacherDashboardClient userName={session.user?.name ?? "Teacher"} />;
}
