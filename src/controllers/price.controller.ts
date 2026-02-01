import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export const updatePrice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { pricePerUser } = req.body;

    // Gunakan upsert: Update data ID 1 jika ada, buat baru jika belum ada
    const config = await prisma.priceConfig.upsert({
      where: { id: 1 },
      update: { pricePerUser: Number(pricePerUser) },
      create: { id: 1, pricePerUser: Number(pricePerUser) },
    });

    return res.status(200).json({ message: "Harga per user berhasil diperbarui", data: config });
  } catch (error) {
    return res.status(500).json({ message: "Gagal memperbarui harga" });
  }
};

export const getPrice = async (req: Request, res: Response): Promise<any> => {
  try {
    const config = await prisma.priceConfig.findUnique({ where: { id: 1 } });
    return res.status(200).json({ data: config || { pricePerUser: 15000 } });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil data harga" });
  }
};