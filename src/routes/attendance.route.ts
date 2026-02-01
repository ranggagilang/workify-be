import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkSubscription } from "../middlewares/subscription.middleware"; // 🔥 Import Middleware
import { 
    clockIn, 
    clockOut, 
    getTodayAttendance, 
    getAttendanceHistory,
    getAllAttendance 
} from "../controllers/attendance.controller";

const router = Router();

// 🔒 KARYAWAN: Tidak bisa absen & lihat data harian jika nunggak
router.post("/clock-in", verifyToken, checkSubscription, clockIn);
router.post("/clock-out", verifyToken, checkSubscription, clockOut);
router.get("/today", verifyToken, checkSubscription, getTodayAttendance);

// 🔓 RIWAYAT: Masih bisa dibuka (Read-only) agar karyawan bisa cek data lama
router.get("/history", verifyToken, getAttendanceHistory);

// 🔒 ADMIN: Tidak bisa monitoring absensi tim jika belum bayar
router.get("/", verifyToken, checkSubscription, getAllAttendance); 

export default router;