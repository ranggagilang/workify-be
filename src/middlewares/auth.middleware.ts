import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";

// 1. Custom Request agar bisa menampung data user
export interface AuthRequest extends Request {
  user?: any; 
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No Token Provided!" });
  }

  try {
    // 2. Verifikasi Token
    const verified = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = verified;

    // 3. Logika Suspension Check (CEK STATUS PERUSAHAAN)
    if (verified.companyId) {
      // Kita gunakan 'as any' di sini agar TypeScript tidak komplain soal field 'status'
      const company = await prisma.company.findUnique({
        where: { id: Number(verified.companyId) },
        select: { status: true }
      }) as any;

      // Jika statusnya SUSPENDED, blokir akses
      if (company && company.status === "SUSPENDED") {
        return res.status(403).json({ 
          message: "Akses dihentikan sementara. Perusahaan Anda dalam status SUSPENDED karena masalah tagihan." 
        });
      }
    }

    next(); 
  } catch (error) {
    return res.status(400).json({ message: "Invalid Token" });
  }
};

// Cek apakah User adalah ADMIN
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): any => {
  if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPERADMIN") {
    return res.status(403).json({ message: "Access Denied: Admins Only!" });
  }
  next();
};

// Cek apakah User adalah SUPERADMIN
export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): any => {
  if (req.user?.role !== "SUPERADMIN") {
    return res.status(403).json({ message: "Access Denied: Superadmin Only!" });
  }
  next();
};