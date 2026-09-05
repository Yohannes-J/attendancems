import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Semester from "@/models/Semester";
import "@/models/Department";
import "@/models/School";
import mongoose from "mongoose";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacherId = (session.user as { id: string }).id;

  await connectDB();

  // Find active semester (if any)
  const activeSemester = await Semester.findOne({ isActive: true }).lean();

  const filter: Record<string, unknown> = {
    teacher: new mongoose.Types.ObjectId(teacherId),
  };
  // Filter to active semester courses only
  if (activeSemester) {
    filter.semester = activeSemester._id;
  }

  const courses = await Course.find(filter)
    .populate({ path: "department", populate: { path: "school", select: "name _id" } })
    .populate("semester", "name academicYear isActive")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json(JSON.parse(JSON.stringify(courses)));
}
