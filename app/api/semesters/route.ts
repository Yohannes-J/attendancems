import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Semester from "@/models/Semester";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const semesters = await Semester.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(JSON.parse(JSON.stringify(semesters)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();

  // If setting this as active, deactivate all others
  if (body.isActive) {
    await Semester.updateMany({}, { isActive: false });
  }

  const semester = await Semester.create({
    name: body.name,
    academicYear: body.academicYear,
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
    isActive: body.isActive ?? false,
  });
  return NextResponse.json(semester, { status: 201 });
}
