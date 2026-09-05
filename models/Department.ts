import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  school: Types.ObjectId;
  createdAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    school: { type: Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

delete mongoose.models["Department"];
const Department: Model<IDepartment> = mongoose.model<IDepartment>("Department", DepartmentSchema);

export default Department;
