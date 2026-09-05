import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISemester extends Document {
  name: string;        // e.g. "Semester 1", "Semester 2"
  academicYear: string; // e.g. "2025/2026"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
}

const SemesterSchema = new Schema<ISemester>(
  {
    name: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

delete mongoose.models["Semester"];
const Semester: Model<ISemester> = mongoose.model<ISemester>("Semester", SemesterSchema);

export default Semester;
