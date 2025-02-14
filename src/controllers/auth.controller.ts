import { Request, Response, NextFunction } from "express";
import CustomError from "../utils/customError";
import { userModel } from "../models/auth.model";
import asyncHandler from "../utils/asyncHandler";

import { generateToken } from "../utils/token.generation";
export const registerUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Implement user registration logic here
  const { username, email, password } = req.body;

  // Validate user inputs
  if (!username || !email || !password) {
    const errorMessage = "All fields are required";
    const error = new CustomError(errorMessage, 400);
    return next(error);
  }
  // check if user already exists in the database
  const existUser = await userModel.findOne({ email });
  if (existUser) {
    const errorMessage = "User already exists";
    const error = new CustomError(errorMessage, 400);
    return next(error);
  }
  // Create a new user in the database
  const newUser = await userModel.create({ username, email, password });
  if (newUser) {
    const token = generateToken(newUser._id as string);

    res.cookie("token", token, {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === "production", // Only HTTPS in production
      sameSite: "strict", // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(201).json({ success: true, message: "User registered successfully", user: newUser.username });
  }
});

// logout
export const logoutUser = (req: Request, res: Response) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
};
