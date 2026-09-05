import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Semester from "@/models/Semester";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  const body = await req.json();

  // If activating this semester, deactivate all others first
  if (body.isActive) {
    await Semester.updateMany({ _id: { $ne: id } }, { isActive: false });
  }

  const semester = await Semester.findByIdAndUpdate(
    id,
    {
      name: body.name,
      academicYear: body.academicYear,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isActive: body.isActive ?? false,
    },
    { new: true }
  ).lean();
  if (!semester) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(JSON.parse(JSON.stringify(semester)));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  await Semester.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
}
