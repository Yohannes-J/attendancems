import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IStudent extends Document {
  name: string;
  studentId: string;
  email: string;
  phone?: string;
  block?: string;
  dormNumber?: string;
  school: Types.ObjectId;
  department: Types.ObjectId;
  enrolledCourses: Types.ObjectId[];
  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    block: { type: String, trim: true },
    dormNumber: { type: String, trim: true },
    school: { type: Schema.Types.ObjectId, ref: "School", required: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

delete mongoose.models["Student"];
const Student: Model<IStudent> = mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
