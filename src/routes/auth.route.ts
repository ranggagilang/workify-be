// backend/src/routes/auth.route.ts

import { Router } from "express";
import { 
    registerCompany, 
    login, 
    changePassword, 
    googleLogin, 
    googleRegisterCheck, 
    registerCompanyWithGoogle,
    getMe // 👈 PASTIKAN INI DI-IMPORT
} from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Route Auth Standar
router.post("/register", registerCompany);
router.post("/login", login);
router.post("/change-password", verifyToken, changePassword);

// Route Google
router.post("/google-login", googleLogin);
router.post("/google-check", googleRegisterCheck);
router.post("/google-register", registerCompanyWithGoogle);

// 👇 INI YANG HILANG (Penyebab Error 404)
// Endpoint ini penting untuk Dashboard mengambil data user & shift
router.get("/me", verifyToken, getMe); 

export default router;