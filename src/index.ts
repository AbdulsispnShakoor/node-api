import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/db_config";
import CustomError from "./utils/customError";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import authRoutes from "./routes/auth.routes";
import cookieParser from "cookie-parser";
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8080;
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Routes
app.use("/api/v1/auth", authRoutes);

// Basic Route
app.get("/", (req: Request, res: Response) => {
  res.send("API is running some changes...");
});

// Handle undefined routes
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new CustomError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Middleware
app.use(globalErrorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
