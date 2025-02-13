import { NextFunction, Request, Response } from "express";
import CustomError from "../utils/customError";
import mongoose from "mongoose";
const globalErrorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  let { statusCode = 500, message } = err;
  const env = process.env.NODE_ENV;

  // Handle Syntax Errors (Invalid JSON)
  if (err instanceof SyntaxError && "body" in err) {
    message = "Invalid JSON payload.";
    statusCode = 400;
    next(new CustomError(message, statusCode));
  }

  // ✅ Fix: Handle Mongoose Validation Errors
  if (err instanceof mongoose.Error.ValidationError) {
    message = Object.values(err.errors) // ✅ Fix applied here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((val: any) => val.message)
      .join(", ");
    statusCode = 400;
    next(new CustomError(message, statusCode));
  }

  // Handle MongoDB Duplicate Key Errors (Error Code 11000)
  if (err.code === 11000) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const duplicatedField = (err as any).keyValue; // Type assertion
    message = `Duplicate field value entered: ${JSON.stringify(duplicatedField)}`;
    statusCode = 400;
    next(new CustomError(message, statusCode));
  }

  // Handle JWT Authentication Errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token. Please log in again.";
    statusCode = 401;
    next(new CustomError(message, statusCode));
  }
  if (err.name === "TokenExpiredError") {
    message = "Token expired. Please log in again.";
    statusCode = 401;
    next(new CustomError(message, statusCode));
  }

  // ✅ Fix: Format Response for Production & Development
  if (env === "development") {
    res.status(statusCode).json({
      status: "error",
      message,
      error: err,
      stack: err.stack,
    });
  } else {
    res.status(statusCode).json({
      status: "error",
      message: err.isOperational ? message : "Something went wrong!",
    });
  }
};

export default globalErrorHandler;
