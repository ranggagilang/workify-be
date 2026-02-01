import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const xenditWebhook = async (req: Request, res: Response): Promise<any> => {
  try {
    const { external_id, status } = req.body;

    // 1. Langsung kirim respon 200 agar Xendit tidak timeout (mencegah Error 502)
    res.status(200).json({ message: "Webhook received" });

    console.log(`📩 Webhook diterima untuk ID: ${external_id} [Status: ${status}]`);

    if (status === "PAID") {
      // 2. Cari transaksi berdasarkan externalId
      const transaction = await prisma.transaction.findFirst({
        where: { externalId: external_id }
      });

      if (!transaction) {
        return console.log(`ℹ️ Info: Transaksi ${external_id} tidak ditemukan (mungkin data testing).`);
      }

      // 3. Hanya update jika status saat ini masih PENDING
      if (transaction.status === "PENDING") {
        await prisma.$transaction([
          // Update status transaksi menjadi PAID
          prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: "PAID" }
          }),

          // 🔥 PERBAIKAN: Update hanya Perusahaan terkait & isi tanggal bayar
          prisma.company.update({
            where: { id: transaction.companyId }, 
            data: { 
              status: "ACTIVE",         // Label di Superadmin jadi Hijau
              isTrial: false,           // Mematikan status Trial
              isActive: true,           // Memastikan akun aktif
              lastBillingDate: new Date() // Menghapus NULL di database kamu
            }
          })
        ]);

        console.log(`✅ Sukses: Perusahaan ${transaction.companyId} sekarang ACTIVE dan lastBillingDate terisi.`);
      } else {
        console.log(`ℹ️ Info: Transaksi ${external_id} sudah pernah diproses.`);
      }
    }
  } catch (error: any) {
    console.error("❌ Webhook Error:", error.message);
  }
};