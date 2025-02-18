import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token = req.headers.authorization;

  if (token && token.startsWith("Bearer")) {
    try {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, invalid token" + error });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
