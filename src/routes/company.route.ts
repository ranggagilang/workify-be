import express from 'express';
import { 
    getAllCompanies,
    getCompanyProfile,    // 👈 Tambahkan Import ini
    updateCompanyProfile  // 👈 Tambahkan Import ini
} from '../controllers/company.controller';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware'; // 👈 Tambahkan isAdmin
import { updateCompanyLogo } from "../controllers/company.controller";

const router = express.Router();

// 1. GET ALL COMPANIES (Biasanya untuk Superadmin)
router.get('/', verifyToken, getAllCompanies);

// ============================================================
// 👇 TAMBAHAN PENTING UNTUK FITUR LOKASI & SETTING
// ============================================================

// 2. GET PROFILE (Untuk Employee & Admin)
// ⚠️ Jangan pakai 'isAdmin' di sini, agar Employee bisa ambil koordinat kantor
router.get('/profile', verifyToken, getCompanyProfile);

// 3. UPDATE PROFILE (Khusus Admin)
// Digunakan di halaman Setting untuk simpan Lat/Long/Radius
router.put('/profile', verifyToken, isAdmin, updateCompanyProfile);
router.put("/update-logo", verifyToken, updateCompanyLogo);

export default router;