import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { getMySubscription, getBillingSummary } from "../controllers/billing.controller";

const router = Router();

router.get("/my-subscription", verifyToken, getMySubscription);
router.get("/summary", verifyToken, getBillingSummary);

export default router;