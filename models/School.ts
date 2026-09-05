import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISchool extends Document {
  name: string;
  address?: string;
  createdAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

delete mongoose.models["School"];
const School: Model<ISchool> = mongoose.model<ISchool>("School", SchoolSchema);

export default School;
