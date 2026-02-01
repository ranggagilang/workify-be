import express from "express";
import { getShifts, createShift, deleteShift } from "../controllers/shift.controller";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware";
import { checkSubscription } from "../middlewares/subscription.middleware"; // 🔥 Import Penjaganya

const router = express.Router();

// 🔓 Get Shifts: Admin tetap bisa melihat daftar shift yang sudah ada
router.get("/", verifyToken, getShifts);

// 🔒 Create Shift: Kunci pembuatan jadwal kerja baru jika billing bermasalah
router.post("/", verifyToken, isAdmin, checkSubscription, createShift);

// 🔒 Delete Shift: Kunci penghapusan jadwal agar operasional tidak terganggu secara permanen
router.delete("/:id", verifyToken, isAdmin, checkSubscription, deleteShift);

export default router;