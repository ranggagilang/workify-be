import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkSubscription } from "../middlewares/subscription.middleware"; // 🔥 Import Penjaganya
import { 
    createLeave, 
    getMyLeaves, 
    getAllLeaves, 
    updateLeaveStatus 
} from "../controllers/leave.controller";

const router = Router();

// ===============================================
// 👥 EMPLOYEE ROUTES
// ===============================================

// 🔒 Create Leave: Kunci pengajuan izin/cuti baru jika billing bermasalah
router.post("/", verifyToken, checkSubscription, createLeave);

// 🔓 My Leaves: Biarkan karyawan tetap bisa melihat status pengajuan mereka (Read-only)
router.get("/my", verifyToken, getMyLeaves);


// ===============================================
// ⚙️ ADMIN ROUTES
// ===============================================

// 🔒 Get All Leaves: Kunci monitoring seluruh data izin jika nunggak
router.get("/all", verifyToken, checkSubscription, getAllLeaves); 

// 🔒 Update Status: Kunci aksi Approval/Rejection dari Admin
router.put("/:id/status", verifyToken, checkSubscription, updateLeaveStatus);

export default router;