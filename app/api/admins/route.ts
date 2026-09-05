import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const admins = await User.find({ role: "admin" }).select("-password").sort({ createdAt: 1 }).lean();
  return NextResponse.json(JSON.parse(JSON.stringify(admins)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();

  const existing = await User.findOne({ email: body.email });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  const admin = await User.create({
    name: body.name,
    email: body.email,
    password: body.password,
    role: "admin",
  });

  return NextResponse.json(
    { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    { status: 201 }
  );
}
