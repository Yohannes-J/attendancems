import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import "@/models/School"; // ensure School model is registered for populate

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  // Don't allow password update via this route; use separate change-password
  const { password: _pw, ...rest } = body;
  const teacher = await User.findOneAndUpdate(
    { _id: id, role: "teacher" },
    { ...rest, school: rest.school || null },
    { new: true }
  ).select("-password").populate({ path: "school", select: "name", strictPopulate: false }).lean();
  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(JSON.parse(JSON.stringify(teacher)));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  await User.findOneAndDelete({ _id: id, role: "teacher" });
  return NextResponse.json({ message: "Deleted" });
}
