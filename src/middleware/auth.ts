import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "change-this-secret-in-prod";

/**
 * Auth middleware: expects Authorization: Bearer <token>
 */
export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"] || req.headers["Authorization"];
  if (!auth || typeof auth !== "string") {
    return res.status(401).json({ message: "Missing authorization header" });
  }
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Invalid authorization header" });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Export alias for compatibility with routes
export const requireAdmin = authenticateAdmin;
