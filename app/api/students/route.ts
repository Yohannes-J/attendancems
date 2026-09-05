import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Semester from "@/models/Semester";
import Course from "@/models/Course";
import "@/models/School";
import "@/models/Department";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get("department");
  const courseId = searchParams.get("course");

  const filter: Record<string, unknown> = {};
  if (deptId) filter.department = new mongoose.Types.ObjectId(deptId);
  if (courseId) filter.enrolledCourses = { $elemMatch: { $eq: new mongoose.Types.ObjectId(courseId) } };

  const students = await Student.find(filter)
    .populate("school", "name")
    .populate("department", "name")
    .populate("enrolledCourses", "name code")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json(JSON.parse(JSON.stringify(students)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();

  const existing = await Student.findOne({
    $or: [{ studentId: body.studentId }, { email: body.email }],
  });
  if (existing) {
    return NextResponse.json({ error: "Student ID or email already exists" }, { status: 400 });
  }

  // Auto-assign courses from the active semester for this department
  let enrolledCourses: mongoose.Types.ObjectId[] = [];
  if (body.department) {
    const activeSemester = await Semester.findOne({ isActive: true });
    if (activeSemester) {
      const deptCourses = await Course.find({
        department: new mongoose.Types.ObjectId(body.department),
        semester: activeSemester._id,
      }).select("_id");
      enrolledCourses = deptCourses.map((c) => c._id as mongoose.Types.ObjectId);
    } else {
      // No active semester — assign all courses of this department regardless
      const deptCourses = await Course.find({
        department: new mongoose.Types.ObjectId(body.department),
      }).select("_id");
      enrolledCourses = deptCourses.map((c) => c._id as mongoose.Types.ObjectId);
    }
  }

  const student = await Student.create({
    name: body.name,
    studentId: body.studentId,
    email: body.email,
    phone: body.phone || undefined,
    block: body.block || undefined,
    dormNumber: body.dormNumber || undefined,
    school: body.school,
    department: body.department,
    enrolledCourses,
  });

  return NextResponse.json(student, { status: 201 });
}
