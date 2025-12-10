import { Router } from "express";
import {
  adminLogin,
  adminCreateDefaultIfMissing,
  getUsers,
  getStats,
  getPlans,
   getPlanById,
  getAnalytics,
  getLocations,
  createPlan,
  updatePlan,
  deletePlanFunc,
  updateUser,
  deleteUserFunc,
  getUserById,
} from "../controllers/adminController";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// Public
router.post("/admin/login", adminLogin);

// Optional one-time bootstrap (now just returns a message)
router.post("/admin/bootstrap-create", adminCreateDefaultIfMissing);

// Protected
router.get("/admin/users", authenticateAdmin, getUsers);
router.get("/admin/stats", authenticateAdmin, getStats);
router.get("/admin/plans", authenticateAdmin, getPlans);
router.get("/admin/analytics", authenticateAdmin, getAnalytics);
router.get("/admin/locations", authenticateAdmin, getLocations);

// Plan CRUD Routes
router.post("/admin/plans", authenticateAdmin, createPlan);
router.put("/admin/plans/:id", authenticateAdmin, updatePlan);
router.delete("/admin/plans/:id", authenticateAdmin, deletePlanFunc);

// Pricing Plans Aliases (for frontend compatibility)
router.get("/admin/pricing-plans", authenticateAdmin, getPlans);
router.get("/admin/pricing-plans/:id", authenticateAdmin, getPlanById);
router.post("/admin/pricing-plans", authenticateAdmin, createPlan);
router.put("/admin/pricing-plans/:id", authenticateAdmin, updatePlan);
router.delete("/admin/pricing-plans/:id", authenticateAdmin, deletePlanFunc);

// User Management Routes
router.get("/admin/users/:id", authenticateAdmin, getUserById);
router.put("/admin/users/:id", authenticateAdmin, updateUser);
router.delete("/admin/users/:id", authenticateAdmin, deleteUserFunc);

export default router;
