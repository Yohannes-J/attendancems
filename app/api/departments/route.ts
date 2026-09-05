import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Department from "@/models/Department";
import "@/models/School"; // ensure School model registered for populate

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("school");
  const filter = schoolId ? { school: schoolId } : {};
  const departments = await Department.find(filter).populate("school", "name").sort({ name: 1 }).lean();
  return NextResponse.json(JSON.parse(JSON.stringify(departments)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const dept = await Department.create({ name: body.name, school: body.school });
  return NextResponse.json(dept, { status: 201 });
}
