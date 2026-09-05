import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Semester from "@/models/Semester";
import Course from "@/models/Course";
import Student from "@/models/Student";
import mongoose from "mongoose";

// POST /api/semesters/[id]/activate
// Activates a semester and re-enrolls ALL students into that semester's courses for their department
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await connectDB();

  const semester = await Semester.findById(id);
  if (!semester) return NextResponse.json({ error: "Semester not found" }, { status: 404 });

  // Deactivate all other semesters
  await Semester.updateMany({ _id: { $ne: id } }, { isActive: false });
  semester.isActive = true;
  await semester.save();

  // Get all courses for this semester grouped by department
  const semesterCourses = await Course.find({ semester: new mongoose.Types.ObjectId(id) }).select("_id department").lean();

  // Group course IDs by department
  const deptCourseMap = new Map<string, mongoose.Types.ObjectId[]>();
  for (const c of semesterCourses) {
    const deptId = c.department.toString();
    if (!deptCourseMap.has(deptId)) deptCourseMap.set(deptId, []);
    deptCourseMap.get(deptId)!.push(c._id as mongoose.Types.ObjectId);
  }

  // Re-enroll every student based on their department
  let updatedCount = 0;
  for (const [deptId, courseIds] of deptCourseMap) {
    const result = await Student.updateMany(
      { department: new mongoose.Types.ObjectId(deptId) },
      { $set: { enrolledCourses: courseIds } }
    );
    updatedCount += result.modifiedCount;
  }

  // Students whose department has no courses in this semester — clear their enrollment
  const deptIdsWithCourses = Array.from(deptCourseMap.keys()).map((id) => new mongoose.Types.ObjectId(id));
  if (deptIdsWithCourses.length > 0) {
    await Student.updateMany(
      { department: { $nin: deptIdsWithCourses } },
      { $set: { enrolledCourses: [] } }
    );
  }

  return NextResponse.json({
    message: `Semester activated. ${updatedCount} students re-enrolled.`,
    semesterName: `${semester.name} ${semester.academicYear}`,
  });
}
