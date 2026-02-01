import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";

export const checkSubscription = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { companyId } = (req as any).user;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ message: "Perusahaan tidak ditemukan" });
    }

    const today = new Date();

    // 1. CEK STATUS MANUAL (PAST_DUE / EXPIRED)
    // Jika admin superadmin mengunci status secara manual
    if (company.status === 'PAST_DUE' || company.status === 'EXPIRED') {
      return res.status(403).json({ 
        message: "Akses dibatasi. Harap selesaikan pembayaran tagihan Anda.",
        isLocked: true 
      });
    }

    // 2. CEK TANGGAL EXPIRED (Sistem Otomatis)
    // Jika hari ini sudah melewati tanggal expiredAt di database
    if (company.expiredAt && today > company.expiredAt) {
      
      // Opsional: Otomatis ubah status di DB jadi EXPIRED jika lewat waktu
      if (company.status !== 'EXPIRED') {
        await prisma.company.update({
          where: { id: companyId },
          data: { status: 'EXPIRED', isActive: false }
        });
      }

      return res.status(403).json({ 
        message: "Masa berlangganan/trial Anda telah habis. Silakan aktivasi kembali.",
        isLocked: true 
      });
    }

    // 3. Lolos: Status ACTIVE/TRIAL dan belum melewati expiredAt
    next(); 
  } catch (error) {
    console.error("Subscription Middleware Error:", error);
    return res.status(500).json({ message: "Gagal memverifikasi status langganan." });
  }
};