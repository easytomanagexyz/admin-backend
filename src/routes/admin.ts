import { Router } from "express";
import {
  adminLogin,
  adminCreateDefaultIfMissing,
  getUsers,
  getStats,
  getPlans,
  getAnalytics,
  getLocations,
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

export default router;
