import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  const { password: _pw, ...rest } = body;
  const admin = await User.findOneAndUpdate(
    { _id: id, role: "admin" },
    rest,
    { new: true }
  ).select("-password").lean();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(JSON.parse(JSON.stringify(admin)));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const currentUserId = (session.user as { id: string }).id;

  // Prevent self-delete
  if (id === currentUserId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await connectDB();

  // Prevent deleting the last admin
  const count = await User.countDocuments({ role: "admin" });
  if (count <= 1) {
    return NextResponse.json({ error: "Cannot delete the last admin account" }, { status: 400 });
  }

  await User.findOneAndDelete({ _id: id, role: "admin" });
  return NextResponse.json({ message: "Deleted" });
}
