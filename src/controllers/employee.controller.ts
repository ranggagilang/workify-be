import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";

// ==========================================
// 1. GET EMPLOYEES (Ambil Semua Karyawan)
// ==========================================
export const getEmployees = async (req: Request, res: Response): Promise<any> => {
  try {
    const companyId = (req as any).user?.companyId;

    const employees = await prisma.user.findMany({
      where: {
        companyId: Number(companyId),
        role: "USER", // Hanya ambil karyawan biasa
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        position: true,
        phone: true,
        image: true,
        // 🟢 KUNCI SINKRONISASI: Menarik data gaji & rekening dari tabel relasi
        employeeSalary: true, 
        
        department: {
            select: { name: true, color: true } 
        },
        shift: {
            select: { id: true, name: true, clockIn: true, clockOut: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({ data: employees });
  } catch (error) {
    console.error("Error getEmployees:", error);
    return res.status(500).json({ message: "Gagal mengambil data karyawan" });
  }
};

// ==========================================
// 2. CREATE EMPLOYEE (Tambah Karyawan Baru)
// ==========================================
export const createEmployee = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, position, phone, departmentId, shiftId, role } = req.body;
    const companyId = (req as any).user?.companyId;

    // A. Cek Email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email sudah digunakan user lain" });

    // B. Generate NIP & Password Default
    const employeeId = "EMP" + Date.now().toString().slice(-6);
    const hashedPassword = await bcrypt.hash("123456", 10);

    // C. Simpan ke Database
    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        employeeId,      
        password: hashedPassword,
        role: role || "USER",    
        companyId: Number(companyId),
        position,
        phone,
        mustChangePassword: true,
        departmentId: departmentId ? Number(departmentId) : null,
        shiftId: shiftId ? Number(shiftId) : null, 
      },
    });

    return res.status(201).json({
      message: "Karyawan berhasil ditambahkan!",
      data: newEmployee
    });

  } catch (error) {
    console.error("Error createEmployee:", error);
    return res.status(500).json({ message: "Gagal menambahkan karyawan" });
  }
};

// ==========================================
// 3. UPDATE EMPLOYEE (Edit Data Umum)
// ==========================================
export const updateEmployee = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params; 
    const { name, phone, position, departmentId, shiftId } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name,
        phone,
        position,
        departmentId: departmentId ? Number(departmentId) : null, 
        shiftId: shiftId ? Number(shiftId) : null, 
      }
    });

    return res.status(200).json({ message: "Data berhasil diupdate", data: updatedUser });
  } catch (error) {
    console.error("Error updateEmployee:", error);
    return res.status(500).json({ message: "Gagal update data" });
  }
};

// ==========================================
// 4. DELETE EMPLOYEE (Hapus Karyawan)
// ==========================================
export const deleteEmployee = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: Number(id) }
    });

    return res.status(200).json({ message: "Karyawan berhasil dihapus" });
  } catch (error) {
    console.error("Error deleteEmployee:", error);
    return res.status(500).json({ message: "Gagal menghapus karyawan" });
  }
};

// ==========================================
// 5. UPDATE SHIFT INDIVIDUAL
// ==========================================
export const updateEmployeeShift = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params; 
    const { shiftId } = req.body; 

    await prisma.user.update({
      where: { id: Number(id) },
      data: { shiftId: Number(shiftId) }
    });

    return res.status(200).json({ message: "Shift karyawan berhasil diupdate!" });
  } catch (error) {
    return res.status(500).json({ message: "Gagal update shift" });
  }
};

// ==========================================
// 6. BULK UPDATE SHIFT
// ==========================================
export const bulkUpdateShift = async (req: Request, res: Response): Promise<any> => {
    try {
      const { employeeIds, shiftId } = req.body; 
      const companyId = (req as any).user?.companyId;
  
      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
          return res.status(400).json({ message: "Pilih minimal satu karyawan!" });
      }
  
      if (!shiftId) {
          return res.status(400).json({ message: "Pilih shift tujuan!" });
      }
  
      const result = await prisma.user.updateMany({
        where: { 
          id: { in: employeeIds }, 
          companyId: Number(companyId) 
        }, 
        data: { 
          shiftId: Number(shiftId) 
        }
      });
  
      return res.status(200).json({ 
          message: `Berhasil update shift untuk ${result.count} karyawan!`,
          count: result.count
      });
    } catch (error) {
      console.error("Bulk Update Error:", error);
      return res.status(500).json({ message: "Gagal melakukan update massal" });
    }
  };