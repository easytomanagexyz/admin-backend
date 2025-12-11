/** @format */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create tenant (used by EatWithMe signup)
router.post('/tenants', async (req, res) => {
	try {
		const {
			name,
			email,
			restaurantId,
			dbName,
			dbUser,
			dbPassword,
			useRedis,
			plan,
			country,
			phone,
		} = req.body;
		// Basic validation to avoid Prisma throwing on missing required fields
		if (!name || !email || !restaurantId || !dbName || !dbUser || !dbPassword) {
			return res.status(400).json({ message: 'Missing required fields' });
		}

		const tenant = await prisma.tenant.create({
			data: {
				name,
				email,
				restaurantId,
				dbName,
				dbUser,
				dbPassword,
				useRedis: Boolean(useRedis),
				plan,
				country,
				phone,
			},
		});

		return res.status(201).json({ restaurantId: tenant.restaurantId });
	} catch (err: any) {
		console.error('[Admin] Create tenant failed', err);
		// Handle duplicate email nicely
		if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
			return res.status(409).json({
				message: 'A restaurant with this email already exists in master DB.',
			});
		}

		return res.status(500).json({ message: 'Failed to create tenant' });
	}
});

// Lookup tenant by email (used by EatWithMe signup to check duplicates)
router.get('/tenants', async (req, res) => {
	const { email } = req.query as { email?: string };

	if (!email) {
		return res.status(400).json({ message: 'email query param required' });
	}

	try {
		const tenant = await prisma.tenant.findUnique({
			where: { email },
		});
		if (!tenant) {
			return res.status(404).json({ message: 'Not found' });
		}

		return res.json({
			id: tenant.id,
			restaurantId: tenant.restaurantId,
			email: tenant.email,
		});
	} catch (err) {
		console.error('[Admin] Find tenant by email failed', err);
		return res.status(500).json({ message: 'Failed to lookup tenant' });
	}
});

// Get tenant by restaurantId (used by POS backend login)
// router.get('/tenants/:restaurantId', async (req, res) => {
// 	const { restaurantId } = req.params;

// 	if (!restaurantId) {
// 		return res.status(400).json({ message: 'restaurantId param required' });
// 	}

// 	try {
// 		const tenant = await prisma.tenant.findUnique({
// 			where: { restaurantId },
// 		});

// 		if (!tenant) {
// 			return res.status(404).json({ message: 'Tenant not found' });
// 		}

// 		return res.json({
// 			id: tenant.id,
// 			restaurantId: tenant.restaurantId,
// 			email: tenant.email,
// 			dbName: tenant.dbName,
// 			useRedis: tenant.useRedis,
// 		});
// 	} catch (err) {
// 		console.error('[Admin] Find tenant by restaurantId failed', err);
// 		return res.status(500).json({ message: 'Failed to lookup tenant' });
// 	}
// });


// Get tenant by restaurantId (used by POS backend login)
router.get('/tenants/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;

  if (!restaurantId) {
    return res.status(400).json({ message: 'restaurantId param required' });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { restaurantId },
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // ✅ include DB connection info needed by POS
    return res.json({
      id: tenant.id,
      restaurantId: tenant.restaurantId,
      email: tenant.email,
      dbName: tenant.dbName,
      dbUser: tenant.dbUser,
      dbPassword: tenant.dbPassword,
      useRedis: tenant.useRedis,
      country: tenant.country,
      city: tenant.city,
      phone: tenant.phone,
    });
  } catch (err) {
    console.error('[Admin] Find tenant by restaurantId failed', err);
    return res.status(500).json({ message: 'Failed to lookup tenant' });
  }
});

export default router;
