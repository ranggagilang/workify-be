import { Request, Response } from "express";
import prisma from "../utils/prisma";

// backend/src/controllers/billing.controller.ts

export const getMySubscription = async (req: Request, res: Response): Promise<any> => {
  try {
    const { companyId } = (req as any).user; 

    const priceCfg = await prisma.priceConfig.findFirst();
    const currentPrice = Number(priceCfg?.pricePerUser || 15000);

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5 
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: "Perusahaan tidak ditemukan" });
    }

    const userCount = await prisma.user.count({
      where: { 
        companyId: companyId,
        role: 'USER' 
      }
    });

    // 4. Susun data untuk dikirim ke Frontend
    const data = {
      status: company.status,
      isTrial: company.isTrial,
      createdAt: company.createdAt,
      expiredAt: company.expiredAt, // 🔥 TAMBAHKAN INI AGAR FE BISA BACA
      totalUser: userCount,
      pricePerUser: currentPrice,
      estimatedBill: userCount * currentPrice,
      history: company.transactions
    };

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Billing Error:", error);
    return res.status(500).json({ message: "Gagal memuat data billing" });
  }
};

export const getBillingSummary = async (req: Request, res: Response): Promise<any> => {
    try {
      const { companyId } = (req as any).user;
      const priceCfg = await prisma.priceConfig.findFirst();
      const currentPrice = Number(priceCfg?.pricePerUser || 15000);
  
      const userCount = await prisma.user.count({
        where: { 
          companyId: companyId,
          role: 'USER' 
        }
      });
  
      return res.status(200).json({ 
        data: { 
          totalUser: userCount, 
          estimatedBill: userCount * currentPrice 
        } 
      });
    } catch (error) {
      return res.status(500).json({ message: "Gagal memuat ringkasan" });
    }
};