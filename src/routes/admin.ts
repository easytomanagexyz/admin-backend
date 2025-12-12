import { Router } from "express";
import {
  adminLogin,
  adminCreateDefaultIfMissing,
  getUsers,
  getStats,
  getPlans,
  getAnalytics,
  getLocations,
  getUserById,
  updateUser,
  deleteUserFunc,
  getPlanById,
} from "../controllers/adminController";
import {
  listPlans,
  createPlan,
  updatePlan,
  clonePlan,
  deletePlan,
} from "../controllers/planController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// ==================== AUTH ====================
// Public
router.post("/admin/login", adminLogin);

// Optional one-time bootstrap
router.post("/admin/bootstrap-create", adminCreateDefaultIfMissing);

// ==================== STATS & ANALYTICS (Protected) ====================
router.get("/admin/stats", authenticateAdmin, getStats);
router.get("/admin/analytics", authenticateAdmin, getAnalytics);
router.get("/admin/locations", authenticateAdmin, getLocations);

// ==================== USERS MANAGEMENT (Protected) ====================
router.get("/admin/users", authenticateAdmin, getUsers);
router.get("/admin/users/:id", authenticateAdmin, getUserById);
router.put("/admin/users/:id", authenticateAdmin, updateUser);
router.delete("/admin/users/:id", authenticateAdmin, deleteUserFunc);

// ==================== PRICING PLANS MANAGEMENT (Protected) ====================
// List plans (with optional ?posType=restaurant filter)
router.get("/admin/plans", authenticateAdmin, listPlans);
router.get("/admin/pricing-plans", authenticateAdmin);
