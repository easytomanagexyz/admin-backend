import express from "express";
import { listTenants, getTenant } from "../controllers/userController";
import { requireAdmin } from "../middleware/auth";
const router = express.Router();

router.get("/tenants", requireAdmin, listTenants);
router.get("/tenants/:id", requireAdmin, getTenant);

export default router;
