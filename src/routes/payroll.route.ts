import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkSubscription } from "../middlewares/subscription.middleware"; // 🔥 Import Penjaganya
import { 
    generatePayroll, 
    getPayrolls, 
    markAsPaid, 
    getMyPayrolls 
} from "../controllers/payroll.controller";

const router = Router();

// ===============================================
// 🔒 ADMIN ROUTES (Premium Features)
// ===============================================

// 🔒 Generate: Kunci fitur hitung gaji otomatis
router.post("/generate", verifyToken, checkSubscription, generatePayroll); 

// 🔓 Get Payrolls: Biarkan Admin tetap bisa melihat history gaji lama (Read-only)
router.get("/", verifyToken, getPayrolls); 

// 🔒 Mark As Paid: Kunci aksi finansial pelunasan gaji
router.put("/:id/pay", verifyToken, checkSubscription, markAsPaid); 


// ===============================================
// 🔓 EMPLOYEE ROUTES (Personal Access)
// ===============================================

// 🔓 My Payrolls: Biarkan karyawan tetap bisa melihat slip gajinya sendiri
// Agar tidak terjadi kericuhan di sisi karyawan meskipun perusahaan nunggak.
router.get("/my", verifyToken, getMyPayrolls); 

export default router;