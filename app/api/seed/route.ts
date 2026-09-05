import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// POST /api/seed — create the first admin user (run once)
export async function POST() {
  await connectDB();

  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    return NextResponse.json({ message: "Admin already exists" }, { status: 400 });
  }

  const admin = await User.create({
    name: "Administrator",
    email: "admin@school.com",
    password: "admin123",
    role: "admin",
  });

  return NextResponse.json({
    message: "Admin created",
    email: admin.email,
    password: "admin123",
  });
}
