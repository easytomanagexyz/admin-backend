    import { Request, Response } from "express";
import prisma from "../utils/prisma";

/**
 * GET /admin/analytics/revenue?months=6
 */
export async function revenueTrend(req: Request, res: Response) {
  try {
    const months = Math.max(1, Number(req.query.months || 6));
    // Disabled: Revenue aggregation query (no Revenue model)
    return res.status(501).json({ message: "Revenue trend not implemented." });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
}

/**
 * GET /admin/analytics/overview
 */
export async function overview(req: Request, res: Response) {
  try {
    const totalTenants = await prisma.tenant.count();
    const activePlans = await prisma.plan.count();
    // Disabled: Revenue aggregation (no Revenue model)
    return res.json({ totalTenants, activePlans });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
}
