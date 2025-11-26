import { Request, Response } from "express";
import { getMasterPrisma } from "../utils/prismaFactory";
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

/**
 * adminLogin → Login for admin users
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const prisma = getMasterPrisma();
    
    // Find admin user
    const admin = await prisma.adminUser.findUnique({
      where: { email }
    });
    
    if (!admin || admin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    // Generate JWT token
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "change-this-secret-in-prod";
    const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, {
      expiresIn: "7d"
    });
    
    return res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error: any) {
    console.error("❌ Error in adminLogin:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

/**
 * adminCreateDefaultIfMissing → Bootstrap default plan
 */
export const adminCreateDefaultIfMissing = async (req: Request, res: Response) => {
  try {
    const prisma = getMasterPrisma();
    
    // Check if any plan exists
    const existingPlans = await prisma.plan.count();
    if (existingPlans > 0) {
      return res.json({
        success: true,
        message: "Plans already exist",
        count: existingPlans
      });
    }
    
    // Create default plan
    const defaultPlan = await prisma.plan.create({
      data: {
        name: "Basic",
        monthlyPrice: 29.99,
        active: true,
        features: {
          create: [
            { feature: "Up to 100 transactions/month" },
            { feature: "Basic reporting" },
            { feature: "Email support" }
          ]
        }
      },
      include: { features: true }
    });
    
    return res.json({
      success: true,
      message: "Default plan created",
      plan: defaultPlan
    });
  } catch (error: any) {
    console.error("❌ Error in adminCreateDefaultIfMissing:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create default plan",
      error: error.message
    });
  }
};

/**
 * getUsers → Get all tenants/users
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const prisma = getMasterPrisma();
    
    const users = await prisma.tenant.findMany({
      include: {
        subscriptions: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error: any) {
    console.error("❌ Error in getUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

/**
 * getStats → Get summary statistics
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const prisma = getMasterPrisma();
    
    const totalTenants = await prisma.tenant.count();
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: "active" }
    });
    
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
    
    return res.json({
      success: true,
      stats: {
        totalUsers: totalTenants,
        activeUsers: activeSubscriptions,
        totalRevenue: (totalRevenueAgg._sum.amountCents || 0) / 100,
        monthlyRevenue: (monthlyRevenueAgg._sum.amountCents || 0) / 100
      }
    });
  } catch (error: any) {
    console.error("❌ Error in getStats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message
    });
  }
};

/**
 * getLocations → Get location data
 */
export const getLocations = async (req: Request, res: Response) => {
  try {
    const prisma = getMasterPrisma();
    
    const locationsRaw = await prisma.tenant.groupBy({
      by: ["country"],
      _count: { id: true }
    });
    
    const locationData = await Promise.all(
      locationsRaw.map(async (loc: any) => {
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
    
    return res.json({
      success: true,
      count: locationData.length,
      locations: locationData
    });
  } catch (error: any) {
    console.error("❌ Error in getLocations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch locations",
      error: error.message
    });
  }
};
};
