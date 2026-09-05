import mongoose, { Document, Model, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "teacher";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  school?: Types.ObjectId;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "teacher"], default: "teacher" },
    school: { type: Schema.Types.ObjectId, ref: "School", default: null },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password as string, 12);
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Delete cached model to force re-compile on hot reload (dev) or after schema changes
delete mongoose.models["User"];

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
