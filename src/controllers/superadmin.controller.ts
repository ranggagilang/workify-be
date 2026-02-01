import { Request, Response } from "express";
import prisma from "../utils/prisma";

// 1. Ambil Harga Global (GET)
export const getGlobalPrice = async (req: Request, res: Response): Promise<any> => {
  try {
    const config = await prisma.priceConfig.findUnique({ where: { id: 1 } });
    return res.status(200).json({ 
      data: { pricePerUser: Number(config?.pricePerUser || 15000) } 
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal ambil harga" });
  }
};

// 2. Update Harga Global (PUT)
export const updateGlobalPrice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { pricePerUser } = req.body;
    const config = await prisma.priceConfig.upsert({
      where: { id: 1 },
      update: { pricePerUser: Number(pricePerUser) },
      create: { id: 1, pricePerUser: Number(pricePerUser) },
    });
    return res.status(200).json({ 
      message: "Harga berhasil diupdate", 
      data: { pricePerUser: Number(config.pricePerUser) } 
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal update harga" });
  }
};

// 3. Monitor Billing & User (GET)
export const getBillingMonitor = async (req: Request, res: Response): Promise<any> => {
  try {
    // Ambil harga konfigurasi saat ini
    const priceCfg = await prisma.priceConfig.findUnique({ where: { id: 1 } });
    const currentPrice = Number(priceCfg?.pricePerUser || 15000);

    // Ambil semua perusahaan dan hitung jumlah USER saja (Exclude ADMIN)
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { 
            // FILTER: Hanya menghitung user yang rolenya 'USER'
            users: { where: { role: 'USER' } } 
          }
        }
      }
    });

    const data = companies.map(c => {
      // Ambil hasil count yang sudah difilter tadi
      const userCount = c._count.users; 
      
      return {
        id: c.id,
        name: c.name,
        totalUser: userCount, // Menampilkan jumlah karyawan asli
        monthlyBill: Number(userCount * currentPrice), // Kalkulasi tagihan berdasarkan karyawan asli
        status: c.status,
        isTrial: c.isTrial
      };
    });

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Billing Monitor Error:", error);
    return res.status(500).json({ message: "Gagal memuat monitoring" });
  }
};

// 4. Suspend/Activate Company (PUT)
export const toggleCompanyStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.company.update({
      where: { id: Number(id) },
      data: { status }
    });
    return res.status(200).json({ message: "Status diperbarui", data: updated });
  } catch (error) {
    return res.status(500).json({ message: "Gagal ubah status" });
  }
};