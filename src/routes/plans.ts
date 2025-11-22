import express from "express";
import { requireAdmin } from "../middleware/auth";
import { listPlans, createPlan, updatePlan, deletePlan } from "../controllers/planController";
const router = express.Router();

router.get("/", requireAdmin, listPlans);
router.post("/", requireAdmin, createPlan);
router.put("/:id", requireAdmin, updatePlan);
router.delete("/:id", requireAdmin, deletePlan);

export default router;
