import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ICourse extends Document {
  name: string;
  code: string;
  department: Types.ObjectId;
  semester: Types.ObjectId | null;
  teacher: Types.ObjectId | null;
  schedule: { day: string; time: string }[];
  createdAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", default: null },
    teacher: { type: Schema.Types.ObjectId, ref: "User", default: null },
    schedule: [
      {
        day: { type: String, required: true },
        time: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Delete cached model to force re-compile after schema changes
delete mongoose.models["Course"];

const Course: Model<ICourse> = mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
