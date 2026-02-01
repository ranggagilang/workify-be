import express from 'express';
import { getSettings, updateProfile, uploadAvatar } from '../controllers/setting.controller';
// 🟢 Import fungsi dari salary controller
import { updateBankInfo } from '../controllers/setting.controller'; // Import fungsinya
import { verifyToken } from '../middlewares/auth.middleware'; 

const router = express.Router();

// Route Profile & Avatar yang sudah ada
router.get('/', verifyToken, getSettings);
router.put('/profile', verifyToken, updateProfile);
router.post('/avatar', verifyToken, uploadAvatar);

// 🟢 TAMBAHKAN INI: Route untuk Rekening Gaji
// URL: PUT http://localhost:4000/api/settings/bank
router.put('/bank', verifyToken, updateBankInfo); // Daftarkan di sini

export default router;