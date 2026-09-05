import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import User from "@/models/User";
import "@/models/School";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const courses = await Course.find()
    .select("name code teacher")
    .populate({ path: "teacher", select: "name email", strictPopulate: false })
    .lean();

  const teachers = await User.find({ role: "teacher" })
    .select("name email _id")
    .lean();

  return NextResponse.json(JSON.parse(JSON.stringify({ courses, teachers })));
}
