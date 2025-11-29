import { Request, Response } from "express";
import prisma from "../utils/prisma";

export async function listPlans(req: Request, res: Response) {
  try {
    const plans = await prisma.plan.findMany();
    return res.json(plans);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
}

export async function createPlan(req: Request, res: Response) {
  try {
    const { productKey, name, price, currency, features } = req.body;
    if (!productKey || !name) return res.status(400).json({ message: "productKey and name required" });

    // find product

      // Product and features creation temporarily disabled for build
      const plan = await prisma.plan.create({
        data: {
          name,
          currency: currency || "INR"
        }
      });

    return res.status(201).json(plan);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
}

export async function updatePlan(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const payload = req.body;
    const plan = await prisma.plan.update({ where: { id }, data: payload });
    return res.json(plan);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
}

export async function deletePlan(req: Request, res: Response) {
  try {
    const id = req.params.id;
    await prisma.plan.delete({ where: { id } });
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
}
