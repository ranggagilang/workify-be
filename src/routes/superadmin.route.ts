import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { 
  updateGlobalPrice, 
  getGlobalPrice, 
  getBillingMonitor, 
  toggleCompanyStatus 
} from "../controllers/superadmin.controller";
import { getGlobalActivities } from "../controllers/activity.controller";

const router = Router();

router.get("/price", verifyToken, getGlobalPrice); 
router.put("/price", verifyToken, updateGlobalPrice);
router.get("/billing-monitor", verifyToken, getBillingMonitor);
router.put("/company/:id/status", verifyToken, toggleCompanyStatus);
router.get("/activity-logs", verifyToken, getGlobalActivities);

export default router;