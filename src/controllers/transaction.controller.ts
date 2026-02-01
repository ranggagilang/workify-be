import { Request, Response } from "express";
import prisma from "../utils/prisma";
import Xendit from "xendit-node";

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY as string
});

// 1. BUAT INVOICE (Sama seperti kodemu, sedikit perapian)
export const createInvoice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { companyId, email } = (req as any).user;

    const priceCfg = await prisma.priceConfig.findUnique({ where: { id: 1 } });
    const currentPrice = Number(priceCfg?.pricePerUser || 15000);
    const userCount = await prisma.user.count({ where: { companyId: Number(companyId), role: 'USER' } });
    const totalAmount = userCount * currentPrice;

    const externalId = `INV-${Date.now()}-${companyId}`;

    const xenditInvoice = await xenditClient.Invoice.createInvoice({
      data: {
        externalId: externalId,
        amount: totalAmount,
        payerEmail: email,
        description: `Tagihan Workify - ${userCount} User`,
        shouldSendEmail: true,
        successRedirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing?status=success`,
      }
    });

    const newTransaction = await prisma.transaction.create({
      data: {
        companyId: Number(companyId),
        totalUser: userCount,
        basePrice: currentPrice,
        amount: totalAmount,
        status: "PENDING",
        externalId: externalId,
        paymentUrl: xenditInvoice.invoiceUrl, 
        description: `Billing Periode ${new Date().toLocaleString('id-ID', { month: 'long' })}`
      }
    });

    return res.status(201).json({ 
      message: "Invoice berhasil dibuat", 
      paymentUrl: xenditInvoice.invoiceUrl 
    });
  } catch (error: any) {
    console.error("❌ Xendit Error:", error);
    return res.status(500).json({ message: "Gagal memproses pembayaran" });
  }
};

// 🔥 2. CALLBACK/WEBHOOK (INILAH YANG MENGUBAH STATUS & TAMBAH 30 HARI)
// Daftarkan route ini di transaction.route.ts: router.post("/callback", xenditCallback);
export const xenditWebhook = async (req: Request, res: Response): Promise<any> => {
  try {
    const { external_id, status } = req.body;
    console.log("🔔 Callback Diterima:", { external_id, status });

    if (status === 'PAID') {
      const transaction = await prisma.transaction.findUnique({
        where: { externalId: external_id },
        include: { company: true }
      });

      if (!transaction) return res.status(404).json({ message: "Transaksi tidak ditemukan" });

      const today = new Date();
      let baseDate = new Date();

      if (transaction.company.expiredAt && transaction.company.expiredAt > today) {
        baseDate = new Date(transaction.company.expiredAt);
      }

      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + 30); // 🔥 TAMBAH 30 HARI

      await prisma.$transaction([
        prisma.transaction.update({
          where: { externalId: external_id },
          data: { status: "PAID", paidAt: new Date() }
        }),
        prisma.company.update({
          where: { id: transaction.companyId },
          data: { 
            status: "ACTIVE", 
            isTrial: false, 
            expiredAt: newExpiry, 
            isActive: true 
          }
        })
      ]);
      console.log(`✅ Update Berhasil untuk ${transaction.company.name}`);
    }
    return res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return res.status(500).json({ message: "Internal Error" });
  }
};

export const getMyTransactions = async (req: Request, res: Response): Promise<any> => {
  try {
    const { companyId } = (req as any).user;
    const transactions = await prisma.transaction.findMany({
      where: { companyId: Number(companyId) },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ data: transactions });
  } catch (error) {
    return res.status(500).json({ message: "Gagal mengambil riwayat transaksi" });
  }
};