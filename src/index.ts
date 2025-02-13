import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/db_config";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8080;
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Basic Route
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

// Global Error Handling Middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
