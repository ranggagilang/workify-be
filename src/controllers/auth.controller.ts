// backend/src/controllers/auth.controller.ts

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- HELPER: Hitung Tanggal Trial (Hari ini + 30 Hari) ---
// 🔥 Sinkron dengan Dashboard: 30 Hari Free Trial
const getTrialEndDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30); 
  return date;
};

// ==========================================
// 1. REGISTER COMPANY (MANUAL)
// ==========================================
export const registerCompany = async (req: Request, res: Response): Promise<any> => {
  try {
    const { companyName, email, phone, fullName, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password and Confirm Password do not match!" });
    }

    const existingUser = await prisma.user.findFirst({ 
        where: { 
            OR: [{ email: email }, { phone: phone }] 
        } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Email or Phone Number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Company dengan TRIAL 30 HARI
      const newCompany = await tx.company.create({
        data: {
          name: companyName,
          phone: phone || null, 
          code: "CMP-" + Date.now(),
          isTrial: true,
          status: "TRIAL",          // 🔥 Status awal TRIAL
          expiredAt: getTrialEndDate(), // 🔥 Ganti ke expiredAt agar muncul di FE
          lastBillingDate: null,
          isActive: true
        },
      });

      // 2. Buat User Admin
      const newAdmin = await tx.user.create({
        data: {
          name: fullName,
          email: email,
          password: hashedPassword,
          role: "ADMIN",
          companyId: newCompany.id,
          mustChangePassword: false, 
        },
      });

      // 3. Buat Salary Setting Default
      await tx.salarySetting.create({
          data: { companyId: newCompany.id }
      });

      return { company: newCompany, user: newAdmin };
    });

    return res.status(201).json({
      message: "Company registered successfully! You have 30 Days Free Trial.",
      data: result,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ==========================================
// 2. LOGIN (SMART LOGIN: EMAIL / NIP)
// ==========================================
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { identifier, email, password } = req.body;
    const loginInput = identifier || email; 

    if (!loginInput || !password) {
        return res.status(400).json({ message: "Silakan masukkan Email/NIP dan Password." });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginInput },      
          { employeeId: loginInput }  
        ]
      },
      include: { 
          company: true,
          shift: true,
          employeeSalary: true
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Akun terdaftar via Google. Silakan gunakan Google Login." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah!" });
    }

    if (user.company && !user.company.isActive) {
        return res.status(403).json({ message: "Akun perusahaan Anda sedang dinonaktifkan." });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company?.name || "Superadmin",
        mustChangePassword: user.mustChangePassword,
        image: user.image,
        shift: user.shift,
        employeeSalary: user.employeeSalary
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ==========================================
// 3. CHANGE PASSWORD
// ==========================================
export const changePassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Konfirmasi password tidak cocok." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) {
       return res.status(400).json({ message: "Pengguna Google tidak dapat mengubah password di sini." });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) return res.status(400).json({ message: "Password lama salah." });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword, mustChangePassword: false },
    });

    return res.status(200).json({ message: "Password berhasil diubah!" });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ==========================================
// 4. GOOGLE LOGIN (STRICT MODE)
// ==========================================
export const googleLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { idToken } = req.body;
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) return res.status(400).json({ message: "Invalid Google Token" });

    const { email, sub: googleId } = payload;

    let user = await prisma.user.findUnique({
        where: { email },
        include: { 
            company: true,
            shift: true,
            employeeSalary: true
        }
    });

    if (!user) {
        return res.status(404).json({ message: "Akun belum terdaftar. Silakan registrasi terlebih dahulu." });
    }

    if (!user.googleId) {
        user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: googleId },
            include: { company: true, shift: true, employeeSalary: true }
        });
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role, companyId: user.companyId },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d" }
    );

    return res.status(200).json({
        message: "Google Login successful",
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          companyName: user.company?.name || "Superadmin",
          mustChangePassword: user.mustChangePassword,
          image: user.image,
          shift: user.shift,
          employeeSalary: user.employeeSalary
        },
    });
  } catch (error) {
    return res.status(500).json({ message: "Google Login Failed" });
  }
};

// ==========================================
// 5. GOOGLE REGISTER CHECK
// ==========================================
export const googleRegisterCheck = async (req: Request, res: Response): Promise<any> => {
    try {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({ idToken: idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        
        if (!payload || !payload.email) return res.status(400).json({ message: "Invalid Token" });

        const { email, name, sub: googleId } = payload;
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) return res.status(400).json({ message: "Email sudah terdaftar. Silakan Login." });

        return res.status(200).json({ message: "User can register", data: { email, name, googleId } });
    } catch (error) {
        return res.status(500).json({ message: "Error checking Google Account" });
    }
};

// ==========================================
// 6. REGISTER COMPANY WITH GOOGLE
// ==========================================
export const registerCompanyWithGoogle = async (req: Request, res: Response): Promise<any> => {
    try {
      const { companyName, email, fullName, googleId, phone } = req.body;
  
      const result = await prisma.$transaction(async (tx) => {
        const newCompany = await tx.company.create({
          data: {
            name: companyName,
            code: "CMP-" + Date.now(),
            isTrial: true,
            status: "TRIAL",
            expiredAt: getTrialEndDate(), // 🔥 30 Hari Trial
            lastBillingDate: null,
            isActive: true
          },
        });
  
        const newAdmin = await tx.user.create({
          data: {
            name: fullName,
            email: email,
            phone: phone, 
            googleId: googleId,
            role: "ADMIN",
            companyId: newCompany.id,
            mustChangePassword: false,
          },
        });

        await tx.salarySetting.create({
            data: { companyId: newCompany.id }
        });
  
        return { company: newCompany, user: newAdmin };
      });
  
      return res.status(201).json({
        message: "Registered with Google! 30 Days Trial Started.",
        data: result
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ==========================================
// 7. GET ME (PROFILE)
// ==========================================
export const getMe = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;

        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            include: { 
                company: true,
                shift: true,
                employeeSalary: true
            }
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        const { password, ...userData } = user;
        return res.status(200).json({ data: userData });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching profile" });
    }
};