import cron from 'node-cron';
import prisma from './prisma'; // Sesuaikan path prisma kamu

// Berjalan setiap hari pukul 00:00 (Tengah Malam)
cron.schedule('0 0 * * *', async () => {
  console.log("Checking for expired trials...");
  
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  try {
    // Cari perusahaan yang trial-nya sudah lewat 14 hari dan status belum ACTIVE
    const expiredCompanies = await prisma.company.updateMany({
      where: {
        isTrial: true,
        createdAt: { lt: fourteenDaysAgo },
        status: { not: 'ACTIVE' }
      },
      data: {
        isTrial: false,
        status: 'EXPIRED' // Middleware akan otomatis mengunci status ini
      }
    });

    console.log(`Berhasil menonaktifkan trial untuk ${expiredCompanies.count} perusahaan.`);
  } catch (error) {
    console.error("Cron Job Error:", error);
  }
});