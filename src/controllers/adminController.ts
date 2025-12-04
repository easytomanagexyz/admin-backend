/** @format */

import { Request, Response } from 'express';
import { getMasterPrisma } from '../utils/prismaFactory';
import { subMonths, format } from 'date-fns';
import { loginAdmin } from '../services/authService';

export const getPlans = async (req: Request, res: Response) => {
	try {
		const prisma = getMasterPrisma();

		const plans = await prisma.plan.findMany({
			where: { active: true },
			include: { features: true },
			orderBy: { monthlyPrice: 'asc' },
		});

		return res.json({
			success: true,
			count: plans.length,
			plans,
		});
	} catch (error: any) {
		console.error('❌ Error in getPlans:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to fetch plans',
			error: error.message,
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

		const totalTenants = await prisma.tenant.count();

		const activeSubscriptions = await prisma.subscription.count({
			where: { status: 'active' },
		});

		const totalRevenueAgg = await prisma.transaction.aggregate({
			_sum: { amountCents: true },
		});

		const monthlyRevenueAgg = await prisma.transaction.aggregate({
			_sum: { amountCents: true },
			where: {
				createdAt: {
					gte: subMonths(new Date(), 1),
				},
			},
		});

		const totalRevenue = (totalRevenueAgg._sum.amountCents || 0) / 100;
		const monthlyRevenue = (monthlyRevenueAgg._sum.amountCents || 0) / 100;

		const revenueTrends: Array<{ month: string; total: number }> = [];

		for (let i = monthsToShow - 1; i >= 0; i--) {
			const start = subMonths(new Date(), i);
			const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
			const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);

			const sumMonth = await prisma.transaction.aggregate({
				_sum: { amountCents: true },
				where: {
					createdAt: { gte: startOfMonth, lt: endOfMonth },
				},
			});

			revenueTrends.push({
				month: format(startOfMonth, 'MMM'),
				total: (sumMonth._sum.amountCents || 0) / 100,
			});
		}

		const restaurantCount = await prisma.tenant.count({
			where: { plan: 'restaurant' },
		});

		const artistCount = await prisma.tenant.count({
			where: { plan: 'artist' },
		});

		const businessCount = await prisma.tenant.count({
			where: { plan: 'business' },
		});

		const userDistribution = [
			{ name: 'Restaurant POS', value: restaurantCount, color: '#f59e0b' },
			{ name: 'Artist/Freelancer POS', value: artistCount, color: '#8b5cf6' },
			{ name: 'Small Business POS', value: businessCount, color: '#6b7280' },
		];

		const locationsRaw = await prisma.tenant.groupBy({
			by: ['country'],
			_count: { id: true },
		});

		const locationData = await Promise.all(
			locationsRaw.map(async (loc) => {
				const countryRevenueAgg = await prisma.transaction.aggregate({
					_sum: { amountCents: true },
					where: {
						tenant: { country: loc.country },
					},
				});

				return {
					country: loc.country,
					users: loc._count.id,
					revenue: (countryRevenueAgg._sum.amountCents || 0) / 100,
				};
			})
		);

		return res.json({
			success: true,
			stats: {
				totalUsers: totalTenants,
				activeUsers: activeSubscriptions,
				totalRevenue,
				monthlyRevenue,
			},
			charts: {
				revenueTrends,
				userDistribution,
				locationData,
			},
		});
	} catch (error: any) {
		console.error('❌ Error in getAnalytics:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to load analytics',
			error: error.message,
		});
	}
};

/**
 * adminLogin → Login for admin users
 */
export const adminLogin = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: 'Email and password are required',
			});
		}

		const result = await loginAdmin(email, password);

		if (!result) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			});
		}

		return res.json({
			success: true,
			token: result.token,
			admin: result.admin,
		});
	} catch (error: any) {
		console.error('❌ Error in adminLogin:', error);
		return res.status(500).json({
			success: false,
			message: 'Login failed',
			error: error.message,
		});
	}
};

/**
 * adminCreateDefaultIfMissing → now disabled for plans
 */
export const adminCreateDefaultIfMissing = async (
	req: Request,
	res: Response
) => {
	try {
		return res.json({
			success: true,
			message: 'Plan auto-creation disabled. Manage plans manually.',
		});
	} catch (error: any) {
		console.error('❌ Error in adminCreateDefaultIfMissing:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to handle default plan check',
			error: error.message,
		});
	}
};

export const getUsers = async (req: Request, res: Response) => {
	try {
		const prisma = getMasterPrisma();

		const users = await prisma.tenant.findMany({
			include: {
				subscriptions: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		return res.json({
			success: true,
			count: users.length,
			users,
		});
	} catch (error: any) {
		console.error('❌ Error in getUsers:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to fetch users',
			error: error.message,
		});
	}
};

export const getStats = async (req: Request, res: Response) => {
	try {
		const prisma = getMasterPrisma();

		const totalTenants = await prisma.tenant.count();
		const activeSubscriptions = await prisma.subscription.count({
			where: { status: 'active' },
		});

		const totalRevenueAgg = await prisma.transaction.aggregate({
			_sum: { amountCents: true },
		});

		const monthlyRevenueAgg = await prisma.transaction.aggregate({
			_sum: { amountCents: true },
			where: {
				createdAt: {
					gte: subMonths(new Date(), 1),
				},
			},
		});

		return res.json({
			success: true,
			stats: {
				totalUsers: totalTenants,
				activeUsers: activeSubscriptions,
				totalRevenue: (totalRevenueAgg._sum.amountCents || 0) / 100,
				monthlyRevenue: (monthlyRevenueAgg._sum.amountCents || 0) / 100,
			},
		});
	} catch (error: any) {
		console.error('❌ Error in getStats:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to fetch stats',
			error: error.message,
		});
	}
};

export const getLocations = async (req: Request, res: Response) => {
	try {
		const prisma = getMasterPrisma();

		const locationsRaw = await prisma.tenant.groupBy({
			by: ['country'],
			_count: { id: true },
		});

		const locationData = await Promise.all(
			locationsRaw.map(async (loc: any) => {
				const countryRevenueAgg = await prisma.transaction.aggregate({
					_sum: { amountCents: true },
					where: {
						tenant: { country: loc.country },
					},
				});
				return {
					country: loc.country,
					users: loc._count.id,
					revenue: (countryRevenueAgg._sum.amountCents || 0) / 100,
				};
			})
		);

		return res.json({
			success: true,
			count: locationData.length,
			locations: locationData,
		});
	} catch (error: any) {
		console.error('❌ Error in getLocations:', error);
		return res.status(500).json({
			success: false,
			message: 'Failed to fetch locations',
			error: error.message,
		});
	}
};
