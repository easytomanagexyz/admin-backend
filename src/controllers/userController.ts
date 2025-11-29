import { Request, Response } from "express";
import prisma from "../utils/prisma";

/**
 * GET /admin/tenants?posType=&q=&page=&limit=
 */
export async function listTenants(req: Request, res: Response) {
  try {
    const { posType, q, page = "1", limit = "20" } = req.query;
    const where: any = {};
    if (posType) where.posType = posType;
    if (q) where.OR = [{ name: { contains: String(q), mode: "insensitive" } }, { email: { contains: String(q), mode: "insensitive" } }];
    const pageN = Math.max(1, Number(page));
    const lim = Math.min(200, Number(limit) || 20);
    const tenants = await prisma.tenant.findMany({
      where,
      skip: (pageN - 1) * lim,
      take: lim,
      orderBy: { createdAt: "desc" }
    });
    const total = await prisma.tenant.count({ where });
    return res.json({ data: tenants, meta: { total, page: pageN, limit: lim } });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
}

export async function getTenant(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const tenant = await prisma.tenant.findUnique({ where: { id }, include: { activities: true } });
    if (!tenant) return res.status(404).json({ message: "Not found" });
    return res.json(tenant);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
}
