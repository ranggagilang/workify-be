import { Request, Response } from "express";
import prisma from "../utils/prisma";

// --- HELPER: RUMUS MENGHITUNG JARAK (Haversine Formula) ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

// ==========================================
// 1. SMART CLOCK IN
// ==========================================
export const clockIn = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id || (req as any).user.userId;
    const { latitude, longitude, type, notes, image, address } = req.body; 

    const now = new Date();
    
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { shift: true, company: true }
    });

    if (!user?.company || !user?.shift) {
      return res.status(400).json({ message: "Anda belum memiliki jadwal shift atau perusahaan." });
    }

    let shiftDate = new Date(now);
    shiftDate.setHours(0, 0, 0, 0);

    const [shiftHour] = user.shift.clockIn.split(':').map(Number);

    if (shiftHour > 15 && now.getHours() < 9) {
        shiftDate.setDate(shiftDate.getDate() - 1);
    }

    const startOfShiftDate = new Date(shiftDate);
    const endOfShiftDate = new Date(shiftDate); endOfShiftDate.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
        where: { 
            userId: Number(userId), 
            date: { gte: startOfShiftDate, lte: endOfShiftDate } 
        }
    });

    if (existing) {
        return res.status(400).json({ message: "Anda sudah Clock In untuk shift ini!" });
    }

    let distance = 0;
    if (user.company.latitude && user.company.longitude && latitude && longitude) {
        distance = calculateDistance(
            parseFloat(latitude), parseFloat(longitude),
            user.company.latitude, user.company.longitude
        );
    }

    if (type === 'WFO') {
        const maxRadius = user.company.radiusKm || 0.1;
        if (distance > maxRadius) {
            return res.status(400).json({ 
                message: `Kejauhan! Jarak: ${distance.toFixed(3)} km. Max: ${maxRadius} km.` 
            });
        }
    }

    const [h, m] = user.shift.clockIn.split(':').map(Number);
    const shiftTime = new Date(shiftDate); 
    shiftTime.setHours(h, m, 0, 0);

    const diffMinutes = (now.getTime() - shiftTime.getTime()) / 60000;
    let status = "PRESENT"; 

    if (diffMinutes > user.shift.absentThresholdMinutes) {
        status = "LATE"; 
    } else if (diffMinutes > user.shift.lateToleranceMinutes) {
        status = "LATE"; 
    }

    const newAttendance = await prisma.attendance.create({
      data: {
        userId: Number(userId),
        date: shiftDate,
        clockIn: now,
        latIn: latitude ? latitude.toString() : null,
        longIn: longitude ? longitude.toString() : null,
        status: status,    
        type: type,        
        distance: distance, 
        notes: notes,
        imageClockIn: image || "", 
        address: address 
      }
    });

    const msg = status === 'LATE' ? `Berhasil (TELAT ${Math.floor(diffMinutes)} Menit)` : "Absen Berhasil! (Tepat Waktu)";
    return res.status(201).json({ message: msg, data: newAttendance });

  } catch (error) {
    console.error("ClockIn Error:", error);
    return res.status(500).json({ message: "Gagal Clock In." });
  }
};

// ==========================================
// 2. CLOCK OUT
// ==========================================
export const clockOut = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id || (req as any).user.userId;
    const { latitude, longitude, image, notes } = req.body;

    const now = new Date();
    
    const attendance = await prisma.attendance.findFirst({ 
        where: { userId: Number(userId) },
        orderBy: { clockIn: 'desc' } 
    });

    if (!attendance) return res.status(400).json({ message: "Belum pernah absen!" });
    if (attendance.clockOut) return res.status(400).json({ message: "Sudah Clock Out sebelumnya." });

    const hoursSinceClockIn = (now.getTime() - new Date(attendance.clockIn).getTime()) / 3600000;
    if (hoursSinceClockIn > 24) {
        return res.status(400).json({ message: "Absen sudah expired (>24 jam). Silakan Clock In baru." });
    }

    const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        include: { shift: true }
    });

    if (user?.shift?.clockOut) {
        const [outHour, outMinute] = user.shift.clockOut.split(':').map(Number);
        const scheduleOut = new Date(attendance.date);
        scheduleOut.setHours(outHour, outMinute, 0, 0);

        const [inHour] = user.shift.clockIn.split(':').map(Number);
        if (outHour < inHour) {
            scheduleOut.setDate(scheduleOut.getDate() + 1);
        }

        if (now < scheduleOut) {
            const diffMinutes = (scheduleOut.getTime() - now.getTime()) / 60000;
            if (diffMinutes > 5) {
                if (!notes || notes.trim() === "") {
                    return res.status(400).json({ 
                        message: `Belum jam pulang! Wajib isi 'Catatan' alasan pulang cepat.` 
                    });
                }
            }
        }
    }

    const finalNotes = notes 
        ? (attendance.notes ? `${attendance.notes} | Pulang Cepat: ${notes}` : `Pulang Cepat: ${notes}`) 
        : attendance.notes;

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        latOut: latitude ? latitude.toString() : null,
        longOut: longitude ? longitude.toString() : null,
        imageClockOut: image || "",
        notes: finalNotes 
      }
    });

    return res.status(200).json({ message: "Clock Out Berhasil! Hati-hati di jalan.", data: updated });
  } catch (error) {
    console.error("ClockOut Error:", error);
    return res.status(500).json({ message: "Gagal Clock Out" });
  }
};

// ==========================================
// 3. GET TODAY
// ==========================================
export const getTodayAttendance = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.id || (req as any).user.userId;
        const now = new Date();
        
        let checkDate = new Date(now);
        checkDate.setHours(0, 0, 0, 0);

        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            include: { shift: true } 
        });

        if (user?.shift) {
            const [shiftHour] = user.shift.clockIn.split(':').map(Number);
            if (shiftHour > 15 && now.getHours() < 9) {
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        const startOfDay = new Date(checkDate);
        const endOfDay = new Date(checkDate); endOfDay.setHours(23, 59, 59, 999);

        const attendance = await prisma.attendance.findFirst({
          where: { 
              userId: Number(userId), 
              date: { gte: startOfDay, lte: endOfDay }
          },
          orderBy: { clockIn: 'desc' }
        });
    
        return res.status(200).json({ 
            data: { 
                ...attendance, 
                shift: user?.shift 
            } 
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetch today data" });
    }
}

// ==========================================
// 4. GET HISTORY
// ==========================================
export const getAttendanceHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id || (req as any).user.userId;
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const history = await prisma.attendance.findMany({
      where: {
         userId: Number(userId),
         date: { gte: startOfMonth, lte: endOfMonth }
      },
      orderBy: { date: 'desc' },
      include: {
          user: { select: { shift: { select: { name: true, clockIn: true, clockOut: true } } } }
      }
    });
    
    const formattedHistory = history.map((item: any) => ({ ...item, shift: item.user?.shift }));
    return res.status(200).json({ message: "Success", data: formattedHistory });
  } catch (error) {
    return res.status(500).json({ message: "Gagal ambil riwayat" });
  }
};

// ==========================================
// 5. GET ALL ATTENDANCE (ADMIN)
// ==========================================
export const getAllAttendance = async (req: Request, res: Response): Promise<any> => {
    try {
      const { date } = req.query; 
      const companyId = (req as any).user?.companyId; 
      
      const targetDate = date ? new Date(date as string) : new Date();
      const startDate = new Date(targetDate); startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(targetDate); endDate.setHours(23, 59, 59, 999);

      const users = await prisma.user.findMany({
        where: { 
            companyId: Number(companyId), 
            role: 'USER' // 🔥 SUDAH DIGANTI JADI USER SESUAI MAUMU
        },
        include: {
          shift: true,
          department: { select: { name: true } },
          attendances: {
            where: { date: { gte: startDate, lte: endDate } }
          },
          leaveRequests: {
            where: {
              status: 'APPROVED',
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            }
          }
        }
      }) as any;

      const formattedList = users.map((user: any) => {
        const attendance = user.attendances?.[0] || null;
        const leave = user.leaveRequests?.[0] || null;

        let finalStatus = attendance ? attendance.status : "ALPA";
        
        if (leave) {
            finalStatus = leave.type; 
        }

        return {
          id: attendance?.id || `no-absent-${user.id}`,
          userId: user.id,
          date: targetDate,
          clockIn: attendance?.clockIn || null,
          clockOut: attendance?.clockOut || null,
          status: finalStatus, 
          user: {
            name: user.name,
            image: user.image,
            employeeId: user.employeeId,
            shift: user.shift,
            department: user.department
          },
          isPermit: !!leave,
          permitDetail: leave ? { type: leave.type, reason: leave.reason } : null
        };
      });

      return res.status(200).json({ data: formattedList });
    } catch (error) {
      console.error("Error Admin Attendance:", error);
      return res.status(500).json({ message: "Gagal ambil data Admin" });
    }
};