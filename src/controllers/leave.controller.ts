import { Request, Response } from "express";
import prisma from "../utils/prisma";

// 1. CREATE LEAVE
export const createLeave = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id || (req as any).user.userId;
    const { type, startDate, endDate, reason, attachment, days } = req.body;

    const newLeave = await prisma.leaveRequest.create({
      data: {
        userId: Number(userId),
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: Number(days) || 1,
        reason,
        attachment
      }
    });
    return res.status(201).json({ message: "Success", data: newLeave });
  } catch (error) {
    return res.status(500).json({ message: "Error create leave" });
  }
};

// 2. GET MY LEAVES
export const getMyLeaves = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id || (req as any).user.userId;
    const leaves = await prisma.leaveRequest.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ data: leaves });
  } catch (error) {
    return res.status(500).json({ message: "Error fetch leaves" });
  }
};

// 👇 3. GET ALL LEAVES (INI YANG TADI HILANG/ERROR)
export const getAllLeaves = async (req: Request, res: Response): Promise<any> => {
  try {
    const companyId = (req as any).user?.companyId;
    const leaves = await prisma.leaveRequest.findMany({
      where: { user: { companyId: Number(companyId) } },
      include: { user: { select: { name: true, image: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ data: leaves });
  } catch (error) {
    return res.status(500).json({ message: "Error fetch admin leaves" });
  }
};

// 👇 4. UPDATE STATUS (INI JUGA TADI HILANG/ERROR)
export const updateLeaveStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;

    const updated = await prisma.leaveRequest.update({
      where: { id: Number(id) },
      data: { status, rejectedReason }
    });
    return res.status(200).json({ message: "Status updated", data: updated });
  } catch (error) {
    return res.status(500).json({ message: "Error update status" });
  }
};