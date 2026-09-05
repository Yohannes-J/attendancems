import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import mongoose from "mongoose";
import "@/models/Student"; // ensure Student registered for populate

// GET /api/attendance?course=xxx&month=10&year=2025
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("course");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (!courseId || !month || !year) {
    return NextResponse.json({ error: "course, month, year required" }, { status: 400 });
  }

  const records = await Attendance.find({
    course: courseId,
    month: Number(month),
    year: Number(year),
  }).populate("student", "name studentId").lean();

  // Filter out records where student was deleted (populate returns null)
  const valid = records.filter((r) => r.student !== null);

  return NextResponse.json(JSON.parse(JSON.stringify(valid)));
}

// POST /api/attendance — bulk upsert
// body: { records: [{ student, course, date, month, year, day, present }] }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const userId = new mongoose.Types.ObjectId((session.user as { id: string }).id);

  const ops = (
    body.records as {
      student: string;
      course: string;
      date: string;
      month: number;
      year: number;
      day: number;
      present: boolean;
    }[]
  ).map((r) => ({
    updateOne: {
      filter: {
        student: new mongoose.Types.ObjectId(r.student),
        course: new mongoose.Types.ObjectId(r.course),
        date: r.date,
      },
      update: {
        $set: {
          present: r.present,
          month: r.month,
          year: r.year,
          day: r.day,
          markedBy: userId,
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(ops);
  return NextResponse.json({ message: "Saved" });
}
