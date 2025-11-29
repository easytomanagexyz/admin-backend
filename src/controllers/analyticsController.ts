    import { Request, Response } from "express";
import prisma from "../utils/prisma";

/**
 * GET /admin/analytics/revenue?months=6
 */
export async function revenueTrend(req: Request, res: Response) {
  try {
    const months = Math.max(1, Number(req.query.months || 6));
    // fetch aggregations (simpler approach: last N months sum grouped by month)
    const rows = await prisma.$queryRaw`
  // export async function revenueTrend(req: Request, res: Response) {
  //   try {
  //     const months = Math.max(1, Number(req.query.months || 6));
  //     // fetch aggregations (simpler approach: last N months sum grouped by month)
  //     const rows = await prisma.$queryRaw`
  //       SELECT year, month, sum(amount) as total
  //       FROM "Revenue"
  //       GROUP BY year, month
  //       ORDER BY year DESC, month DESC
  //       LIMIT ${months};
  //     `;
  //     return res.json(rows);
  //   } catch (err) {
  //     return res.status(500).json({ message: "Server error", error: (err as Error).message });
  //   }
  // }
      ORDER BY year DESC, month DESC
      LIMIT ${months};
    `;
    return res.json(rows);
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
    const totalRevenueRow: any = await prisma.revenue.aggregate({ _sum: { amount: true } });
  // export async function overview(req: Request, res: Response) {
  //   try {
  //     const totalTenants = await prisma.tenant.count();
  //     const totalRevenueRow: any = await prisma.revenue.aggregate({ _sum: { amount: true } });
  //     const totalRevenue = totalRevenueRow._sum.amount || 0;
  //     const activePlans = await prisma.plan.count();
  // 
  //     return res.json({ totalTenants, totalRevenue, activePlans });
  //   } catch (err) {
  //     return res.status(500).json({ message: "Server error", error: (err as Error).message });
  //   }
  // }
    const activePlans = await prisma.plan.count();

    return res.json({ totalTenants, totalRevenue, activePlans });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
}
