import { Request, Response, NextFunction } from "express";

// Wraps async functions and passes errors to Express error middleware
const asyncHandler =
  /*eslint-disable*/


    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) =>
      Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
