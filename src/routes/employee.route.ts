import express from "express";
import { 
    getEmployees, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee,
    updateEmployeeShift,
    bulkUpdateShift 
} from "../controllers/employee.controller";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware";
import { checkSubscription } from "../middlewares/subscription.middleware"; // 🔥 Import Penjaganya

const router = express.Router();

// 🔓 Get All Employees: Tetap buka agar Admin bisa melihat data yang sudah ada
router.get("/", verifyToken, getEmployees);

// 🔒 Create Employee: Kunci agar tidak bisa tambah beban user sebelum bayar
router.post("/", verifyToken, isAdmin, checkSubscription, createEmployee);

// ===============================================
// 🔥 ROUTE BARU: BULK UPDATE (Update Massal)
// 🔒 Locked: Tidak bisa ganti jadwal massal jika nunggak
// ===============================================
router.patch("/bulk-shift", verifyToken, isAdmin, checkSubscription, bulkUpdateShift); 

// 🔒 Update & Delete: Kunci perubahan data permanen
router.put("/:id", verifyToken, isAdmin, checkSubscription, updateEmployee); 
router.delete("/:id", verifyToken, isAdmin, checkSubscription, deleteEmployee);

// 🔒 Route Khusus Update Shift Satu Orang
router.patch("/:id/shift", verifyToken, isAdmin, checkSubscription, updateEmployeeShift);

export default router;