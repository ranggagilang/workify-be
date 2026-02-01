// backend/src/controllers/setting.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";

// 1. GET ALL SETTINGS
export const getSettings = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true, 
        department: true, // Tambahan: Include department biar bisa dilihat user
        activities: {  
            orderBy: { createdAt: 'desc' },
            take: 5 
        } 
      }
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      data: {
        user: {
            name: user.name || "",
            email: user.email || "",
            role: user.role || "",
            image: user.image || "", 
            phone: user.phone || "",
            bio: user.bio || "",
            address: user.address || "",
            // city & country DIHAPUS karena tidak ada di schema baru
            position: user.position || "",
            department: user.department?.name || "-", // Tampilkan nama departemen
        },
        company: user.company,
        logs: user.activities
      }
    });
  } catch (error) {
    console.error("Error Get Settings:", error);
    return res.status(500).json({ message: "Error fetching settings" });
  }
};

// 2. UPDATE PROFILE
export const updateProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user?.userId;
    
    // HAPUS city & country dari sini
    const { name, phone, bio, address } = req.body;

    console.log("Menerima Data Update:", req.body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name, 
        phone, 
        bio, 
        address
        // city & country TIDAK PERLU DI-UPDATE LAGI
      }
    });

    // Log Aktivitas (TETAP ADA)
    await prisma.activityLog.create({
        data: { 
            userId, 
            action: "Update Profile", 
            details: "User updated personal details." 
        }
    });

    return res.status(200).json({ message: "Profile updated!", data: updatedUser });
  } catch (error) {
    console.error("Error Update Profile:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

// 3. UPLOAD AVATAR (TETAP SAMA SEPERTI KODINGAN KAMU)
export const uploadAvatar = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user?.userId;
        const { imageBase64 } = req.body; 

        // --- DEBUGGING: LIHAT TERMINAL BACKEND ---
        if (imageBase64) {
            console.log("✅ Backend Menerima Data Gambar!");
            console.log("📏 Panjang Karakter Base64:", imageBase64.length);
        } else {
            console.log("❌ Backend Menerima Request, TAPI gambar kosong/undefined");
        }
        // -----------------------------------------

        if (!imageBase64) return res.status(400).json({ message: "No image data" });

        await prisma.user.update({
            where: { id: userId },
            data: { image: imageBase64 } 
        });
        
        await prisma.activityLog.create({
            data: { 
                userId, 
                action: "Update Avatar", 
                details: "User changed profile picture." 
            }
        });

        return res.status(200).json({ message: "Avatar updated!" });
    } catch (error) {
        console.error("❌ Error Upload Avatar:", error);
        return res.status(500).json({ message: "Upload failed. Cek terminal backend." });
    }
};

// Tambahkan ini di bagian bawah backend/src/controllers/setting.controller.ts

export const updateBankInfo = async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Ambil ID User dari token login (pastikan menggunakan userId sesuai middleware Anda)
    const userId = (req as any).user?.userId;

    // 2. Ambil data dari body request
    const { bankName, bankAccount, accountHolder } = req.body;

    if (!userId) return res.status(401).json({ message: "User tidak terautentikasi" });

    // 3. Gunakan UPSERT: Update jika sudah ada, Create jika belum ada
    const salaryData = await prisma.employeeSalary.upsert({
      where: { userId: Number(userId) },
      update: {
        bankName,
        bankAccount,
        accountHolder: accountHolder || ""
      },
      create: {
        userId: Number(userId),
        bankName,
        bankAccount,
        accountHolder: accountHolder || "",
        // WAJIB: Berikan nilai 0 agar database tidak error 500 karena kolom gaji kosong
        basicSalary: 0,      
        fixedAllowance: 0    
      }
    });

    return res.status(200).json({ 
      message: "Berhasil disimpan!", 
      data: salaryData 
    });
  } catch (error: any) {
    console.error("❌ ERROR DATABASE:", error);
    return res.status(500).json({ message: "Gagal simpan ke database" });
  }
};