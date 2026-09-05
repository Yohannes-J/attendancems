import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import "@/models/Department";
import "@/models/User";
import "@/models/Semester";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get("department");
  const teacherId = searchParams.get("teacher");
  const semesterId = searchParams.get("semester");

  const filter: Record<string, string> = {};
  if (deptId) filter.department = deptId;
  if (teacherId) filter.teacher = teacherId;
  if (semesterId) filter.semester = semesterId;

  const courses = await Course.find(filter)
    .populate("department", "name")
    .populate("teacher", "name email")
    .populate("semester", "name academicYear isActive")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json(JSON.parse(JSON.stringify(courses)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const course = await Course.create({
    name: body.name,
    code: body.code,
    department: body.department,
    semester: body.semester || null,
    teacher: body.teacher || null,
    schedule: body.schedule || [],
  });
  return NextResponse.json(course, { status: 201 });
}
