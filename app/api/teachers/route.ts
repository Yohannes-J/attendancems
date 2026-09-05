import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import "@/models/School"; // ensure School model is registered for populate

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const teachers = await User.find({ role: "teacher" })
    .select("-password")
    .populate({ path: "school", select: "name", strictPopulate: false })
    .sort({ name: 1 })
    .lean();
  return NextResponse.json(JSON.parse(JSON.stringify(teachers)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();

  const existing = await User.findOne({ email: body.email });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const teacher = await User.create({
    name: body.name,
    email: body.email,
    password: body.password,
    role: "teacher",
    school: body.school || null,
  });

  return NextResponse.json(
    { _id: teacher._id, name: teacher.name, email: teacher.email, role: teacher.role, school: teacher.school },
    { status: 201 }
  );
}
