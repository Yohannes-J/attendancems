import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAttendance extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  month: number; // 1-12
  year: number;
  day: number; // 1-31
  present: boolean;
  markedBy: Types.ObjectId;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    date: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    day: { type: Number, required: true },
    present: { type: Boolean, default: false },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Unique attendance per student per course per day
AttendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

delete mongoose.models["Attendance"];
const Attendance: Model<IAttendance> = mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
