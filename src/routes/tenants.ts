/** @format */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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

		const tenant = await prisma.tenant.create({
			data: {
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
			},
		});

		res.status(201).json({ restaurantId: tenant.restaurantId });
	} catch (err: any) {
		console.error('[Admin] Create tenant failed', err);

		if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
			return res
				.status(409)
				.json({
					message: 'A restaurant with this email already exists in master DB.',
				});
		}

		return res.status(500).json({ message: 'Failed to create tenant' });
	}
});

export default router;
/*
// Temporarily disabled for build
*/
