import { Document, Schema, model, CallbackError } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Please enter a username."],
    },
    email: {
      type: String,
      required: [true, "Please enter an email address."],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please enter a password."],
      minlength: [6, "Password must be at least 6 characters."],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Hash the password before saving it to the database
userSchema.pre<IUser>("save", async function (next) {
  const user = this as IUser & Document; // Explicitly cast 'this' to IUser

  if (!user.isModified("password")) return next();

  try {
    user.password = await bcrypt.hash(user.password, 10);
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

// Compare the entered password with the hashed password in the database
// ✅ Define comparePassword method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const userModel = model<IUser>("User", userSchema);
