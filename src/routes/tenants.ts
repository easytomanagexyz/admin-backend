import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/master';

const router = Router();
const prisma = new PrismaClient();

// GET /api/tenants/:restaurantId/credentials
// Fetch tenant DB credentials securely (requires authentication)
router.get('/:restaurantId/credentials', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    
    const tenant = await prisma.tenant.findUnique({
      where: { restaurantId },
      select: {
        id: true,
        name: true,
        dbName: true,
        dbUser: true,
        dbPassword: true,
        useRedis: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      dbName: tenant.dbName,
      dbUser: tenant.dbUser,
      dbPassword: tenant.dbPassword,
      useRedis: tenant.useRedis,
    });
  } catch (error) {
    console.error('Error fetching tenant credentials:', error);
    res.status(500).json({ error: 'Failed to fetch tenant credentials' });
  }
});

export default router;
