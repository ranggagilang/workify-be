import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkSubscription } from "../middlewares/subscription.middleware"; // 🔥 Import Penjaganya
import { getLetters, createLetter, deleteLetter } from "../controllers/letter.controller";

const router = Router();

// 🔓 Get Letters: Admin masih bisa melihat daftar surat yang sudah pernah dibuat sebelumnya
router.get("/", verifyToken, getLetters);

// 🔒 Create Letter: Kunci fitur pembuatan dokumen/surat baru
router.post("/", verifyToken, checkSubscription, createLetter); 

// 🔒 Delete Letter: Kunci penghapusan dokumen agar data tetap terjaga saat masa penangguhan
router.delete("/:id", verifyToken, checkSubscription, deleteLetter);

export default router;