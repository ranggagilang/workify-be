import { Request, Response } from "express";
import prisma from "../utils/prisma";

// ==========================================
// 1. GENERATE PAYROLL (HITUNG GAJI OTOMATIS)
// ==========================================
export const generatePayroll = async (req: Request, res: Response): Promise<any> => {
    try {
        const companyId = (req as any).user.companyId;
        const { month, year } = req.body; // Input: { month: 1, year: 2026 }

        if (!month || !year) {
            return res.status(400).json({ message: "Bulan dan Tahun wajib diisi!" });
        }

        const periodString = `${String(month).padStart(2, '0')}-${year}`; // "01-2026"

        // A. Ambil Rules Perusahaan (Denda, Lembur, Tunjangan Harian)
        const settings = await prisma.salarySetting.findUnique({
            where: { companyId: Number(companyId) }
        });

        if (!settings) {
            return res.status(400).json({ message: "Harap setting Rules Gaji (Settings) terlebih dahulu!" });
        }

        // B. Ambil Semua Karyawan Aktif di Perusahaan Ini
        const employees = await prisma.user.findMany({
            where: { companyId: Number(companyId), role: "USER" },
            include: { employeeSalary: true }
        });

        if (employees.length === 0) {
            return res.status(400).json({ message: "Tidak ada karyawan aktif untuk digaji." });
        }

        // C. Tentukan Range Tanggal Absensi (Tgl 1 s/d Akhir Bulan)
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // D. LOOPING & HITUNG (The Payroll Engine 🚂)
        const payrolls = [];

        for (const emp of employees) {
            // 1. Ambil Data Absensi Bulan Ini
            const attendances = await prisma.attendance.findMany({
                where: {
                    userId: emp.id,
                    date: { gte: startDate, lte: endDate }
                }
            });

            // 2. Hitung Statistik Kehadiran
            const attendanceDays = attendances.length; // Jumlah hari masuk
            const lateCount = attendances.filter(a => a.status === 'LATE').length; // Jumlah terlambat
            
            // 3. Ambil Gaji Pokok (Default 0 jika belum diset)
            const basicSalary = Number(emp.employeeSalary?.basicSalary) || 0;
            const fixedAllowance = Number(emp.employeeSalary?.fixedAllowance) || 0;

            // 4. Hitung Tunjangan Variabel (Harian)
            // Rumus: (Uang Makan + Transport) * Jumlah Hadir
            const dailyAllowanceRate = Number(settings.mealAllowance) + Number(settings.transportAllowance);
            const variableAllowance = dailyAllowanceRate * attendanceDays;
            
            const totalAllowance = fixedAllowance + variableAllowance;

            // 5. Hitung Potongan (Denda Telat)
            const totalDeduction = Number(settings.latePenalty) * lateCount;

            // 6. Hitung Gaji Bersih (THP - Take Home Pay)
            const netSalary = basicSalary + totalAllowance - totalDeduction;

            // 7. Simpan ke Database (Upsert: Update jika sudah ada, Create jika belum)
            // Kita cari dulu apakah payroll bulan ini untuk user ini sudah ada?
            const existingPayroll = await prisma.payroll.findFirst({
                where: {
                    userId: emp.id,
                    month: periodString
                }
            });

            let payroll;
            if (existingPayroll) {
                // Update Data Lama
                payroll = await prisma.payroll.update({
                    where: { id: existingPayroll.id },
                    data: {
                        basicSalary,
                        totalAllowance,
                        totalDeduction,
                        netSalary,
                        attendanceDays,
                        lateCount,
                        overtimeHours: 0, // Sementara 0 dulu
                        details: {
                            fixed_allowance: fixedAllowance,
                            variable_allowance_total: variableAllowance,
                            late_penalty_total: totalDeduction
                        }
                    }
                });
            } else {
                // Buat Data Baru
                payroll = await prisma.payroll.create({
                    data: {
                        userId: emp.id,
                        companyId: Number(companyId),
                        month: periodString,
                        basicSalary,
                        totalAllowance,
                        totalDeduction,
                        netSalary,
                        attendanceDays,
                        lateCount,
                        overtimeHours: 0,
                        status: 'PENDING', // Default belum dibayar
                        details: {
                            fixed_allowance: fixedAllowance,
                            variable_allowance_total: variableAllowance,
                            late_penalty_total: totalDeduction
                        }
                    }
                });
            }
            payrolls.push(payroll);
        }

        return res.status(200).json({ 
            message: `Berhasil generate ${payrolls.length} slip gaji untuk periode ${periodString}`, 
            data: payrolls 
        });

    } catch (error) {
        console.error("Payroll Error:", error);
        return res.status(500).json({ message: "Gagal generate payroll. Cek log server." });
    }
};

// ==========================================
// 2. GET PAYROLL HISTORY (LIST SLIP GAJI - ADMIN)
// ==========================================
export const getPayrolls = async (req: Request, res: Response): Promise<any> => {
    try {
        const companyId = (req as any).user.companyId;
        const { month, year } = req.query;

        let whereClause: any = { companyId: Number(companyId) };
        
        if (month && year) {
            const periodString = `${String(month).padStart(2, '0')}-${year}`;
            whereClause.month = periodString;
        }

        const payrolls = await prisma.payroll.findMany({
            where: whereClause,
            include: { 
                user: { 
                    select: { name: true, position: true, image: true } 
                } 
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({ data: payrolls });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching payrolls" });
    }
};

// ==========================================
// 3. MARK AS PAID (KONFIRMASI TRANSFER)
// ==========================================
export const markAsPaid = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        await prisma.payroll.update({
            where: { id: Number(id) },
            data: { status: 'PAID', paymentDate: new Date() }
        });
        return res.status(200).json({ message: "Status slip gaji berhasil diupdate menjadi PAID" });
    } catch (error) {
        return res.status(500).json({ message: "Gagal update status pembayaran" });
    }
};

// ==========================================
// 4. GET MY PAYROLLS (KHUSUS EMPLOYEE)
// ==========================================
// backend/src/controllers/payroll.controller.ts

export const getMyPayrolls = async (req: Request, res: Response): Promise<any> => {
    try {
        // Ambil ID dari token (sesuaikan dengan nama field di middleware Anda, misal userId)
        const userId = (req as any).user?.userId || (req as any).user?.id;

        const payrolls = await prisma.payroll.findMany({
            where: { userId: Number(userId) },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({ data: payrolls });
    } catch (error) {
        return res.status(500).json({ message: "Gagal memuat slip gaji" });
    }
};