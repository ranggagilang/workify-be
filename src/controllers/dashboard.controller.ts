import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getAdminDashboardStats = async (req: Request, res: Response): Promise<any> => {
    try {
        const companyId = (req as any).user.companyId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tentukan Awal Bulan Ini (Tgl 1 jam 00:00)
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Total Employee (Semua user aktif)
        const totalEmployees = await prisma.user.count({
            where: { companyId: Number(companyId), role: 'USER' }
        });

        // 2. New Recruits (Karyawan Baru Bulan Ini)
        // Hitung user yang dibuat (createdAt) >= Tanggal 1 bulan ini
        const newRecruits = await prisma.user.count({
            where: { 
                companyId: Number(companyId), 
                role: 'USER',
                createdAt: { gte: startOfMonth }
            }
        });

        // 3. Attendance Today
        const attendanceToday = await prisma.attendance.groupBy({
            by: ['status'],
            where: {
                user: { companyId: Number(companyId) },
                date: { gte: today }
            },
            _count: { status: true }
        });

        // Mapping hasil group by
        let present = 0, late = 0;
        attendanceToday.forEach(item => {
            if (item.status === 'PRESENT') present = item._count.status;
            if (item.status === 'LATE') late = item._count.status;
        });

        // Absen = Total Pegawai - (Hadir + Telat)
        const absent = totalEmployees - (present + late);

        // 4. Estimasi Payroll Bulan Ini (Gaji Pokok + Tunjangan Tetap)
        const salaries = await prisma.employeeSalary.aggregate({
            where: { user: { companyId: Number(companyId) } },
            _sum: { basicSalary: true, fixedAllowance: true }
        });
        
        const estimatedPayroll = (Number(salaries._sum.basicSalary) || 0) + (Number(salaries._sum.fixedAllowance) || 0);

        // 5. Activity Logs Terakhir
        const recentLogs = await prisma.activityLog.findMany({
            where: { user: { companyId: Number(companyId) } },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, image: true } } }
        });

        return res.status(200).json({
            data: {
                employees: totalEmployees,
                newRecruits: newRecruits, // Data baru dikirim ke frontend
                attendance: { present, late, absent },
                finance: { estimatedPayroll },
                logs: recentLogs
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error loading dashboard" });
    }
};