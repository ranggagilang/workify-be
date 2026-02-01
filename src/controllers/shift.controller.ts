import { Request, Response } from "express";
import prisma from "../utils/prisma";

// 1. GET ALL SHIFTS (Berdasarkan Company User yang Login)
export const getShifts = async (req: Request, res: Response): Promise<any> => {
  try {
    // Ambil companyId dari user yang login biar datanya gak kecampur antar perusahaan
    const companyId = (req as any).user?.companyId;

    const shifts = await prisma.shift.findMany({
        where: { companyId: companyId } 
    });
    
    return res.status(200).json({ data: shifts });
  } catch (error) {
    return res.status(500).json({ message: "Gagal ambil data shift" });
  }
};

// 2. CREATE SHIFT (INI YANG TADI ERROR)
export const createShift = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, clockIn, clockOut, lateToleranceMinutes, absentThresholdMinutes } = req.body;
    
    // 👇 AMBIL COMPANY ID DARI USER YANG LOGIN
    const companyId = (req as any).user?.companyId; 

    if (!name || !clockIn || !clockOut) {
        return res.status(400).json({ message: "Nama, Jam Masuk, dan Pulang wajib diisi" });
    }

    const newShift = await prisma.shift.create({
      data: {
        name,
        clockIn,
        clockOut,
        lateToleranceMinutes: Number(lateToleranceMinutes) || 0,
        absentThresholdMinutes: Number(absentThresholdMinutes) || 0,
        // 👇 SOLUSI ERROR: Masukkan companyId ke sini
        companyId: companyId 
      }
    });

    return res.status(201).json({ message: "Shift berhasil dibuat!", data: newShift });
  } catch (error) {
    console.error(error); 
    return res.status(500).json({ message: "Gagal membuat shift" });
  }
};

// 3. DELETE SHIFT
export const deleteShift = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.shift.delete({ where: { id: Number(id) } });
    return res.status(200).json({ message: "Shift dihapus" });
  } catch (error) {
    return res.status(500).json({ message: "Gagal hapus shift" });
  }
};