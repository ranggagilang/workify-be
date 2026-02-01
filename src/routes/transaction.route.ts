import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { 
  getMyTransactions, 
  createInvoice, 
  xenditWebhook // 🔥 Pastikan namanya xenditWebhook (sesuai controller baru)
} from "../controllers/transaction.controller";

const router = Router();

router.get("/my", verifyToken, getMyTransactions);
router.post("/create", verifyToken, createInvoice);

// 🔥 Pintunya harus pas: /api/transaction/webhook/xendit
router.post("/webhook/xendit", xenditWebhook); 

export default router;