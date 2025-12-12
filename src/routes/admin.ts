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

// Optional one-time bootstrap (now just returns a message)
router.post("/admin/bootstrap-create", adminCreateDefaultIfMissing);

// ==================== PROTECTED ROUTES ====================

// ---- Stats & Analytics ----
router.get("/admin/stats", authenticateAdmin, getStats);
router.get("/admin/analytics", authenticateAdmin, getAnalytics);
router.get("/admin/locations", authenticateAdmin, getLocations);

// ---- Users Management ----
router.get("/admin/users", authenticateAdmin, getUsers);
router.get("/admin/users/:id", authenticateAdmin, getUserById);
router.put("/admin/users/:id", authenticateAdmin, updateUser);
router.delete("/admin/users/:id", authenticateAdmin, deleteUserFunc);

// ---- Pricing Plans Management ----
// List plans (with optional posType filter)
router.get("/admin/plans", authenticateAdmin, listPlans);
router.get("/admin/pricing-plans", authenticateAdmin, listPlans); // Alias for frontend compatibility

// Get single plan
router.get("/admin/plans/:id", authenticateAdmin, getPlanById);
router.get("/admin/pricing-plans/:id", authenticateAdmin, getPlanById); // Alias

// Create plan
router.post("/admin/plans", authenticateAdmin, createPlan);
router.post("/admin/pricing-plans", authenticateAdmin, createPlan); // Alias

// Update plan
router.put("/admin/plans/:id", authenticateAdmin, updatePlan);
router.put("/admin/pricing-plans/:id", authenticateAdmin, updatePlan); // Alias

// Clone plan to another POS type
router.post("/admin/plans/:id/clone", authenticateAdmin, clonePlan);
router.post("/admin/pricing-plans/:id/clone", authenticateAdmin, clonePlan); // Alias

// Delete plan
router.delete("/admin/plans/:id", authenticateAdmin, deletePlan);
router.delete("/admin/pricing-plans/:id", authenticateAdmin, deletePlan); // Alias

// Old getPlans endpoint (for backward compatibility)
router.get("/admin/plans-old", authenticateAdmin, getPlans);

export default router;
