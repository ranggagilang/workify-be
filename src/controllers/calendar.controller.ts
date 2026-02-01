import { Request, Response } from "express";
import prisma from "../utils/prisma";

// 1. BUAT EVENT BARU
// 1. BUAT EVENT BARU (UPDATED WARNA HEX)
export const createEvent = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return res.status(400).json({ message: "No Company" });

    // Ambil color dari request body (jika admin kirim custom color)
    let { title, start, end, type, description, color } = req.body;

    // Jika Admin TIDAK kirim warna manual, tentukan otomatis berdasarkan tipe (Pakai HEX Code)
    if (!color) {
        color = '#3B82F6'; // Default Blue (Lainnya)
        if (type === 'SHIFT')   color = '#A855F7'; // Purple
        if (type === 'HOLIDAY') color = '#EF4444'; // Red
        if (type === 'EVENT')   color = '#F97316'; // Orange
        if (type === 'MEETING') color = '#F97316'; // Orange (Sama dengan Event)
    }

    const event = await prisma.calendarEvent.create({
      data: {
        companyId: user.companyId,
        title,
        start: new Date(start),
        end: new Date(end),
        type,         // Tipe (Meeting, Libur, dll)
        description,
        color         // ✅ Simpan Hex Code warna
      }
    });

    return res.status(201).json({ message: "Jadwal berhasil dibuat", data: event });
  } catch (error) {
    return res.status(500).json({ message: "Gagal membuat jadwal" });
  }
};

// 2. AMBIL SEMUA EVENT PERUSAHAAN (UNTUK ADMIN)
export const getEvents = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Validasi company
    if (!user?.companyId) {
        return res.status(400).json({ message: "Anda belum terdaftar di perusahaan manapun." });
    }

    const events = await prisma.calendarEvent.findMany({
      where: { 
        companyId: user.companyId 
      },
      orderBy: { start: 'asc' }
    });

    return res.status(200).json({ data: events });
  } catch (error) {
    return res.status(500).json({ message: "Gagal ambil jadwal" });
  }
};

// 3. HAPUS EVENT
export const deleteEvent = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        await prisma.calendarEvent.delete({ where: { id: Number(id) } });
        return res.status(200).json({ message: "Jadwal dihapus" });
    } catch (error) {
        return res.status(500).json({ message: "Gagal hapus" });
    }
}

// ==========================================
// 4. GET MY SCHEDULE (UNTUK DASHBOARD EMPLOYEE)
// ==========================================
export const getMySchedule = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        
        // 1. Ambil Data User
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            include: { shift: true }
        });

        if (!user?.companyId) return res.status(400).json({ message: "No Company" });

        // 2. Ambil SEMUA Event Kalender Perusahaan
        // 👇 PERUBAHAN: Saya hapus filter tanggal & limit
        // Agar tanggal 1 Januari (masa lalu) tetap muncul di Kalender
        const events = await prisma.calendarEvent.findMany({
            where: { 
                companyId: user.companyId
            },
            orderBy: { start: 'asc' }
        });

        // 3. Format Data untuk Frontend
        return res.status(200).json({
            data: {
                shift: user.shift, 
                events: events     
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Gagal ambil jadwal saya" });
    }
};