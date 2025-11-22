import { Request, Response } from "express";
import { getMasterPrisma } from "../utils/prismaMaster";
import { subMonths, format } from "date-fns";

export const getPlans = async (req: Request, res: Response) => {
  try {
    const prisma = getMasterPrisma();

    const plans = await prisma.plan.findMany({
      where: { active: true },
      include: { features: true },
      orderBy: { monthlyPrice: "asc" }
    });

    return res.json({
      success: true,
      count: plans.length,
      plans
    });

  } catch (error: any) {
    console.error("❌ Error in getPlans:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
      error: error.message
    });
  }
};



/**
 * getAnalytics → Full analytics for Admin Dashboard
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const prisma = getMasterPrisma();
    const monthsToShow = Number(req.query.months || 8);

    /** ---------------------------
     *  1️⃣ Total users + active subs
     ---------------------------- */
    const totalTenants = await prisma.tenant.count();

    const activeSubscriptions = await prisma.subscription.count({
      where: { status: "active" }
    });

    /** ---------------------------
     *  2️⃣ Revenue (monthly + total)
     ---------------------------- */
    const totalRevenueAgg = await prisma.transaction.aggregate({
      _sum: { amountCents: true }
    });

    const monthlyRevenueAgg = await prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: {
        createdAt: {
          gte: subMonths(new Date(), 1)
        }
      }
    });

    const totalRevenue = (totalRevenueAgg._sum.amountCents || 0) / 100;
    const monthlyRevenue = (monthlyRevenueAgg._sum.amountCents || 0) / 100;

    /** ---------------------------
     *  3️⃣ Revenue Trends (Line Chart)
     ---------------------------- */
    const revenueTrends: Array<{ month: string; total: number }> = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const start = subMonths(new Date(), i);
      const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);

      const sumMonth = await prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: {
          createdAt: { gte: startOfMonth, lt: endOfMonth }
        }
      });

      revenueTrends.push({
        month: format(startOfMonth, "MMM"),
        total: (sumMonth._sum.amountCents || 0) / 100
      });
    }

    /** ---------------------------
     *  4️⃣ POS User Distribution (Pie Chart)
     ---------------------------- */
    const restaurantCount = await prisma.tenant.count({
      where: { plan: "restaurant" }
    });

    const artistCount = await prisma.tenant.count({
      where: { plan: "artist" }
    });

    const businessCount = await prisma.tenant.count({
      where: { plan: "business" }
    });

    const userDistribution = [
      { name: "Restaurant POS", value: restaurantCount, color: "#f59e0b" },
      { name: "Artist/Freelancer POS", value: artistCount, color: "#8b5cf6" },
      { name: "Small Business POS", value: businessCount, color: "#6b7280" }
    ];

    /** ---------------------------
     *  5️⃣ Location Data (Locations Tab)
     ---------------------------- */
    const locationsRaw = await prisma.tenant.groupBy({
      by: ["country"],
      _count: { id: true }
    });

    const locationData = await Promise.all(
      locationsRaw.map(async (loc) => {
        const countryRevenueAgg = await prisma.transaction.aggregate({
          _sum: { amountCents: true },
          where: {
            tenant: { country: loc.country }
          }
        });

        return {
          country: loc.country,
          users: loc._count.id,
          revenue: (countryRevenueAgg._sum.amountCents || 0) / 100
        };
      })
    );

    /** ---------------------------
     *  📦 Final JSON Response
     ---------------------------- */
    return res.json({
      success: true,
      stats: {
        totalUsers: totalTenants,
        activeUsers: activeSubscriptions,
        totalRevenue,
        monthlyRevenue
      },
      charts: {
        revenueTrends,
        userDistribution,
        locationData
      }
    });

  } catch (error: any) {
    console.error("❌ Error in getAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load analytics",
      error: error.message
    });
  }
};
