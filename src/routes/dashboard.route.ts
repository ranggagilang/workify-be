import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { getAdminDashboardStats } from "../controllers/dashboard.controller";

const router = Router();
router.get("/stats", verifyToken, getAdminDashboardStats);
export default router;