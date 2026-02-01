import { Request, Response } from "express";
import prisma from "../utils/prisma";

// ==========================================
// 1. COMPANY SETTINGS (ATURAN MAIN)
// ==========================================

// Get Settings
export const getCompanySalarySettings = async (req: Request, res: Response): Promise<any> => {
    try {
        const companyId = (req as any).user.companyId;
        const settings = await prisma.salarySetting.findUnique({
            where: { companyId: Number(companyId) }
        });
        return res.status(200).json({ data: settings || {} });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching settings" });
    }
};

// Update Settings (Denda, Lembur, Tunjangan Harian)
export const updateCompanySalarySettings = async (req: Request, res: Response): Promise<any> => {
    try {
        const companyId = (req as any).user.companyId;
        const { 
            overtimeRate, latePenalty, alphaPenalty, 
            transportAllowance, mealAllowance 
        } = req.body;

        const settings = await prisma.salarySetting.upsert({
            where: { companyId: Number(companyId) },
            update: {
                overtimeRate, latePenalty, alphaPenalty,
                transportAllowance, mealAllowance
            },
            create: {
                companyId: Number(companyId),
                overtimeRate, latePenalty, alphaPenalty,
                transportAllowance, mealAllowance
            }
        });

        return res.status(200).json({ message: "Rules Gaji Berhasil Disimpan!", data: settings });
    } catch (error) {
        return res.status(500).json({ message: "Gagal update settings" });
    }
};

// ==========================================
// 2. EMPLOYEE SALARY (GAJI POKOK KARYAWAN)
// ==========================================

// Update Gaji Pokok User Tertentu
export const updateEmployeeSalary = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, basicSalary, fixedAllowance, bankName, bankAccount, accountHolder } = req.body;

        // Validasi: Pastikan user ada di company yang sama (Security Check)
        // (Bisa ditambahkan logic cek companyId admin vs user)

        const salary = await prisma.employeeSalary.upsert({
            where: { userId: Number(userId) },
            update: {
                basicSalary, fixedAllowance, bankName, bankAccount, accountHolder
            },
            create: {
                userId: Number(userId),
                basicSalary, fixedAllowance, bankName, bankAccount, accountHolder
            }
        });

        return res.status(200).json({ message: "Gaji Karyawan Disimpan!", data: salary });
    } catch (error) {
        return res.status(500).json({ message: "Gagal update gaji karyawan" });
    }
};

// Get Detail Gaji User Tertentu (Untuk Admin cek)
export const getEmployeeSalary = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.params;
        const salary = await prisma.employeeSalary.findUnique({
            where: { userId: Number(userId) }
        });
        return res.status(200).json({ data: salary });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching employee salary" });
    }
};

export const getSalarySettings = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const settings = await prisma.salarySetting.findUnique({
      where: { companyId }
    });
    res.json({ data: settings });
  } catch (error) {
    res.status(500).json({ message: "Gagal ambil setting" });
  }
};

export const updateSalarySettings = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const { overtimeRate, latePenalty, transportAllowance, mealAllowance } = req.body;

    const settings = await prisma.salarySetting.upsert({
      where: { companyId },
      update: { overtimeRate, latePenalty, transportAllowance, mealAllowance },
      create: { companyId, overtimeRate, latePenalty, transportAllowance, mealAllowance },
    });

    res.json({ message: "Setting berhasil disimpan", data: settings });
  } catch (error) {
    res.status(500).json({ message: "Gagal simpan setting" });
  }
};