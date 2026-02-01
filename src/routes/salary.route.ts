import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkSubscription } from "../middlewares/subscription.middleware"; // 🔥 Import Penjaganya
import { 
    getCompanySalarySettings, 
    updateCompanySalarySettings, 
    getEmployeeSalary, 
    updateEmployeeSalary 
} from "../controllers/salary.controller";

const router = Router();

// ===============================================
// ⚙️ KONFIGURASI GAJI PERUSAHAAN
// ===============================================

// 🔓 Get Settings: Admin masih bisa melihat konfigurasi yang ada
router.get("/settings", verifyToken, getCompanySalarySettings);

// 🔒 Update Settings: Kunci agar tidak bisa ubah kebijakan gaji saat nunggak
router.put("/settings", verifyToken, checkSubscription, updateCompanySalarySettings);


// ===============================================
// 👥 KONFIGURASI GAJI KARYAWAN (PER USER)
// ===============================================

// 🔓 Get Employee Salary: Tetap buka agar bisa cek data gaji karyawan tertentu
router.get("/employee/:userId", verifyToken, getEmployeeSalary);

// 🔒 Update Employee Salary: Kunci agar tidak bisa edit nominal gaji karyawan
router.post("/employee", verifyToken, checkSubscription, updateEmployeeSalary);

export default router;