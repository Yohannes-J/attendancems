import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AttendancePageClient from "./AttendancePageClient";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; month?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const now = new Date();

  return (
    <AttendancePageClient
      initialCourseId={params.course ?? ""}
      initialMonth={Number(params.month ?? now.getMonth() + 1)}
      initialYear={Number(params.year ?? now.getFullYear())}
    />
  );
}
