// backend/src/controllers/activity.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getGlobalActivities = async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Ambil data Transaksi (sebagai log pembelian)
    const transactions = await prisma.transaction.findMany({
      include: { company: { select: { name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 2. Ambil data Log Aktivitas (sebagai log sistem)
    const systemLogs = await prisma.activityLog.findMany({
      include: { user: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 3. Gabungkan dan format data agar sesuai dengan tampilan Frontend
    const combined = [
      ...transactions.map(t => ({
        id: t.id,
        type: 'Purchase',
        description: `Pembayaran tagihan Rp ${Number(t.amount).toLocaleString()} diterima.`,
        createdAt: t.createdAt,
        company: t.company
      })),
      ...systemLogs.map(l => ({
        id: l.id,
        type: 'Update',
        description: `${l.action}: ${l.details}`,
        createdAt: l.createdAt,
        company: l.user.company
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ data: combined });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil log" });
  }
};