import express from "express";
import { requireAdmin } from "../middleware/auth";
import { revenueTrend, overview } from "../controllers/analyticsController";
const router = express.Router();

router.get("/revenue", requireAdmin, revenueTrend);
router.get("/overview", requireAdmin, overview);

export default router;
