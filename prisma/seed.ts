import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai Seeding...');

  // 1. Hapus bagian SubscriptionPlan karena modelnya sudah tidak ada di schema.prisma
  // Sistem sekarang menggunakan status ACTIVE/TRIAL langsung di model Company

  // 2. Buat Akun SUPERADMIN
  // Password di-hash agar bisa login secara manual (bukan via Google)
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@workify.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@workify.com',
      password: hashedPassword,
      role: 'SUPERADMIN', // Role khusus untuk mengelola database perusahaan
      googleId: null,
      mustChangePassword: false,
    },
  });

  console.log('✅ Akun Superadmin berhasil dibuat: superadmin@workify.com / admin123');
  console.log('🚀 Seeding selesai dengan sukses!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding Gagal:', e);
    await prisma.$disconnect();
    process.exit(1);
  });