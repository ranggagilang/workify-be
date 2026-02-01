import { Request, Response } from "express";
import prisma from "../utils/prisma";

// --- HELPER: AMAN UBAH STRING KE ANGKA ---
// Biar input "0,1" (indo) tetap terbaca sebagai 0.1 (internasional)
const safeParseFloat = (val: any) => {
    if (!val) return undefined;
    if (typeof val === 'number') return val;
    // Ganti koma jadi titik, lalu parse
    const str = String(val).replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? undefined : num;
};

// 1. GET ALL COMPANIES
export const getAllCompanies = async (req: Request, res: Response): Promise<any> => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        departments: true,
        users: {                
           where: { role: 'ADMIN' },
           take: 1,
           select: { name: true, email: true, phone: true } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ message: "Success fetch companies", data: companies });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 2. GET COMPANY PROFILE
export const getCompanyProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const companyId = (req as any).user?.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "Gagal: Token tidak mengandung Company ID" });
    }

    const company = await prisma.company.findUnique({
      where: { id: Number(companyId) },
      include: { departments: true }
    });

    if (!company) return res.status(404).json({ message: "Company not found" });

    return res.status(200).json({ data: company });
  } catch (error) {
    console.error("Error Get Company:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 3. UPDATE COMPANY PROFILE (YANG SEBELUMNYA GAGAL SIMPAN LOGO)
export const updateCompanyProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const companyId = (req as any).user?.companyId;
    
    // 👇 1. CEK ID
    if (!companyId) {
        console.error("❌ ERROR: User tidak punya Company ID!");
        return res.status(400).json({ message: "User tidak terdaftar di perusahaan manapun." });
    }

    // 👇 2. LOGGING DATA MASUK (Biar kelihatan di terminal backend)
    console.log("📥 [UPDATE COMPANY] ID:", companyId);
    console.log("📦 Data Body:", req.body);

    // SEKARANG SUDAH DITAMBAHKAN 'image' DI DESTRUCTURING
    const { name, phone, address, radiusKm, latitude, longitude, workingType, image } = req.body;

    // 👇 3. CONVERT DATA (Safe Parsing)
    const lat = safeParseFloat(latitude);
    const lng = safeParseFloat(longitude);
    const rad = safeParseFloat(radiusKm);

    // Cek apakah hasil convert NaN (Not a Number)
    console.log(`🔢 Parsed Data -> Lat: ${lat}, Lng: ${lng}, Radius: ${rad}, Type: ${workingType}`);

    const updatedCompany = await prisma.company.update({
      where: { id: Number(companyId) },
      data: {
        name,
        phone,
        address,
        image,             // ✅ SEKARANG SUDAH DISIMPAN KE DATABASE
        workingType,       // ✅ PENTING: Simpan setting WFO/WFA/HYBRID
        radiusKm: rad,     // Pakai hasil convert yang aman
        latitude: lat,     // Pakai hasil convert yang aman
        longitude: lng      // Pakai hasil convert yang aman
      },
    });

    console.log("✅ SUCCESS UPDATE DATABASE");
    
    return res.status(200).json({
      message: "Company profile updated successfully",
      data: updatedCompany,
    });
  } catch (error: any) {
    // 👇 4. TAMPILKAN ERROR ASLI KE FRONTEND
    console.error("❌ ERROR UPDATE COMPANY:", error);
    
    // Jika error dari Prisma
    if (error.code === 'P2025') {
        return res.status(404).json({ message: "Data perusahaan tidak ditemukan di database." });
    }

    return res.status(500).json({ 
        message: "Gagal update database. Cek terminal backend untuk detail.",
        errorDetail: error.message 
    });
  }
};

// 4. UPDATE KHUSUS LOGO (ENDPOINT TAMBAHAN)
export const updateCompanyLogo = async (req: Request, res: Response): Promise<any> => {
  try {
    const { companyId } = (req as any).user; // Ambil dari token
    const { image } = req.body; // Terima base64 dari frontend

    if (!image) return res.status(400).json({ message: "Logo tidak boleh kosong" });

    const updated = await prisma.company.update({
      where: { id: Number(companyId) },
      data: { image: image } // Simpan ke field baru di schema
    });

    return res.status(200).json({ 
      message: "Logo perusahaan berhasil diperbarui", 
      data: updated 
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal update logo" });
  }
};