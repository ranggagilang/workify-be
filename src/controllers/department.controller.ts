// backend/src/controllers/department.controller.ts

// 👇 PENTING: Pastikan import dari 'express', BUKAN dari tempat lain
import { Request, Response } from "express"; 
import prisma from "../utils/prisma";

// ==========================================
// 1. GET ALL DEPARTMENTS (RESTORED ✅)
// ==========================================
export const getDepartments = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    const companyId = user?.companyId;

    if (!companyId) {
        return res.status(400).json({ message: "Company ID not found" });
    }

    const departments = await prisma.department.findMany({
      where: { companyId: companyId },
      include: { 
        _count: { select: { users: true } } 
      }
    });

    return res.status(200).json({ data: departments });
  } catch (error) {
    console.error("Error Get Dept:", error);
    return res.status(500).json({ message: "Gagal mengambil data departemen" });
  }
};

// ==========================================
// 2. CREATE DEPARTMENT (WITH DEBUGGING 🕵️‍♂️)
// ==========================================
export const createDepartment = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log("👉 [DEBUG] Masuk ke createDepartment");

    const { name, color } = req.body;
    const user = (req as any).user;
    
    console.log("👉 [DEBUG] User Info dari Token:", user);

    const companyId = user?.companyId;

    // Cek kelengkapan data
    if (!name) {
        console.log("❌ [DEBUG] Gagal: Nama kosong");
        return res.status(400).json({ message: "Nama departemen wajib diisi" });
    }
    
    if (!companyId) {
        console.log("❌ [DEBUG] Gagal: Company ID tidak ditemukan di token");
        return res.status(400).json({ message: "Company ID tidak ditemukan. Coba Login Ulang." });
    }

    // Cek Duplikat
    const existingDept = await prisma.department.findFirst({
        where: { 
            companyId: companyId,
            name: name 
        }
    });

    if (existingDept) {
        console.log("❌ [DEBUG] Gagal: Departemen sudah ada");
        return res.status(400).json({ message: "Departemen dengan nama ini sudah ada" });
    }

    console.log(`👉 [DEBUG] Mencoba create dept: ${name} untuk Company ID: ${companyId}`);

    const newDept = await prisma.department.create({
      data: {
        name,
        color: color || "#19A0FA",
        companyId
      }
    });

    console.log("✅ [DEBUG] Berhasil Create Dept!");
    
    return res.status(201).json({ 
        message: "Departemen berhasil dibuat!", 
        data: newDept 
    });

  } catch (error) {
    console.error("❌ [DEBUG] ERROR SERVER:", error);
    return res.status(500).json({ message: "Gagal membuat departemen (Server Error)" });
  }
};