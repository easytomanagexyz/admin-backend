import { Request, Response } from "express";
import { getMasterPrisma } from "../utils/prismaFactory";

/**
 * List all plans, optionally filtered by posType
 */
export async function listPlans(req: Request, res: Response) {
  try {
    const prisma = getMasterPrisma();
    const { posType } = req.query;

    // If posType filter is provided, only return plans for that POS type
    const where = posType ? { active: true, posType: String(posType) } : { active: true };

    const plans = await prisma.plan.findMany({
      where,
      include: { features: true },
      orderBy: { monthlyPrice: "asc" },
    });

    return res.json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (err) {
    console.error("❌ Error in listPlans:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: (err as Error).message,
    });
  }
}

/**
 * Create a plan for a specific POS type
 * Frontend sends: name, posType, price, billingCycle, description, features
 */
export async function createPlan(req: Request, res: Response) {
  try {
    const prisma = getMasterPrisma();
    const {
      name,
      posType,
      price,
      billingCycle,
      description,
      features,
      transactionLimit,
      userLimit,
      storageLimit,
      supportLevel,
    } = req.body;

    // Validate required fields
    if (!name || price == null || !posType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, price, posType",
      });
    }

    // Validate posType
    const validPosTypes = [
      "restaurant",
      "artist",
      "business",
      "salon",
      "bakery",
      "healthcare",
      "education",
    ];
    if (!validPosTypes.includes(posType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid posType. Must be one of: ${validPosTypes.join(", ")}`,
      });
    }

    // Derive slug from name + posType to ensure uniqueness
    const slug = `${posType}-${name.toLowerCase().replace(/\s+/g, "-")}`;

    // Convert price to monthlyPrice
    const monthlyPrice = Number(price);
    let yearlyPrice: number | null = null;

    // Calculate yearly price based on billing cycle
    if (billingCycle === "yearly") {
      yearlyPrice = monthlyPrice * 12;
    } else if (billingCycle === "quarterly") {
      yearlyPrice = monthlyPrice * 4;
    } else if (billingCycle === "lifetime") {
      yearlyPrice = null;
    }

    // Create plan with all fields
    const plan = await prisma.plan.create({
      data: {
        slug,
        name,
        description: description || null,
        currency: "INR",
        monthlyPrice,
        yearlyPrice,
        posType,
        billingCycle: billingCycle || "monthly",
        transactionLimit: transactionLimit || null,
        userLimit: userLimit || null,
        storageLimit: storageLimit || null,
        supportLevel: supportLevel || null,
        active: true,
        features:
          features && features.length > 0
            ? {
                create: features.map((f: string) => ({
                  name: f,
                })),
              }
            : undefined,
      },
      include: { features: true },
    });

    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
    });
  } catch (err) {
    console.error("❌ Error in createPlan:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create plan",
      error: (err as Error).message,
    });
  }
}

/**
 * Update a plan
 */
export async function updatePlan(req: Request, res: Response) {
  try {
    const prisma = getMasterPrisma();
    const { id } = req.params;
    const {
      name,
      price,
      billingCycle,
      description,
      features,
      transactionLimit,
      userLimit,
      storageLimit,
      supportLevel,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }

    // Build data object dynamically (don't allow changing posType)
    const updateData: any = {};

    if (name) {
      updateData.name = name;
    }

    if (price != null) {
      updateData.monthlyPrice = Number(price);

      if (billingCycle === "yearly") {
        updateData.yearlyPrice = Number(price) * 12;
      } else if (billingCycle === "quarterly") {
        updateData.yearlyPrice = Number(price) * 4;
      } else if (billingCycle === "lifetime") {
        updateData.yearlyPrice = null;
      }
    }

    if (billingCycle) {
      updateData.billingCycle = billingCycle;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (transactionLimit !== undefined) {
      updateData.transactionLimit = transactionLimit;
    }

    if (userLimit !== undefined) {
      updateData.userLimit = userLimit;
    }

    if (storageLimit !== undefined) {
      updateData.storageLimit = storageLimit;
    }

    if (supportLevel !== undefined) {
      updateData.supportLevel = supportLevel;
    }

    // Update plan
    const plan = await prisma.plan.update({
      where: { id },
      data: updateData,
      include: { features: true },
    });

    return res.json({
      success: true,
      message: "Plan updated successfully",
      plan,
    });
  } catch (err) {
    console.error("❌ Error in updatePlan:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update plan",
      error: (err as Error).message,
    });
  }
}

/**
 * Clone a plan to a different POS type
 * POST /api/admin/pricing-plans/:id/clone
 * Body: { targetPosType: "salon" }
 */
export async function clonePlan(req: Request, res: Response) {
  try {
    const prisma = getMasterPrisma();
    const { id } = req.params;
    const { targetPosType } = req.body;

    if (!id || !targetPosType) {
      return res.status(400).json({
        success: false,
        message: "Plan ID and targetPosType are required",
      });
    }

    // Validate targetPosType
    const validPosTypes = [
      "restaurant",
      "artist",
      "business",
      "salon",
      "bakery",
      "healthcare",
      "education",
    ];
    if (!validPosTypes.includes(targetPosType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid targetPosType. Must be one of: ${validPosTypes.join(", ")}`,
      });
    }

    // Fetch the original plan
    const originalPlan = await prisma.plan.findUnique({
      where: { id },
      include: { features: true },
    });

    if (!originalPlan) {
      return res.status(404).json({
        success: false,
        message: "Original plan not found",
      });
    }

    // Create cloned plan with new posType
    const newSlug = `${targetPosType}-${originalPlan.name.toLowerCase().replace(/\s+/g, "-")}`;

    const clonedPlan = await prisma.plan.create({
      data: {
        slug: newSlug,
        name: originalPlan.name,
        description: originalPlan.description,
        currency: originalPlan.currency,
        monthlyPrice: originalPlan.monthlyPrice,
        yearlyPrice: originalPlan.yearlyPrice,
        posType: targetPosType,
        billingCycle: originalPlan.billingCycle,
        transactionLimit: originalPlan.transactionLimit,
        userLimit: originalPlan.userLimit,
        storageLimit: originalPlan.storageLimit,
        supportLevel: originalPlan.supportLevel,
        active: originalPlan.active,
        features:
          originalPlan.features.length > 0
            ? {
                create: originalPlan.features.map((f) => ({
                  name: f.name,
                })),
              }
            : undefined,
      },
      include: { features: true },
    });

    return res.status(201).json({
      success: true,
      message: `Plan cloned to ${targetPosType} successfully`,
      plan: clonedPlan,
    });
  } catch (err) {
    console.error("❌ Error in clonePlan:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to clone plan",
      error: (err as Error).message,
    });
  }
}

/**
 * Delete a plan
 */
export async function deletePlan(req: Request, res: Response) {
  try {
    const prisma = getMasterPrisma();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }

    await prisma.plan.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error in deletePlan:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete plan",
      error: (err as Error).message,
    });
  }
}
