import { Request, Response } from "express";
import prisma from "../utils/prisma";

// 1. GET ALL (Untuk Employee & Admin)
export const getLetters = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    // Asumsi: Ambil surat berdasarkan company user tersebut
    const companyId = user.companyId; 

    const letters = await prisma.documentTemplate.findMany({
      where: { companyId: Number(companyId) },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ data: letters });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching letters" });
  }
};

// 2. CREATE (Khusus Admin - Upload Template)
export const createLetter = async (req: Request, res: Response): Promise<any> => {
  try {
    const companyId = (req as any).user.companyId;
    const { title, description, fileUrl } = req.body; // fileUrl berisi Base64 PDF

    const newLetter = await prisma.documentTemplate.create({
      data: {
        title,
        description,
        fileUrl, 
        companyId: Number(companyId),
        category: 'PERMIT'
      }
    });
    return res.status(201).json({ message: "Template created", data: newLetter });
  } catch (error) {
    return res.status(500).json({ message: "Error create letter" });
  }
};

// 3. DELETE (Khusus Admin)
export const deleteLetter = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        await prisma.documentTemplate.delete({ where: { id: Number(id) } });
        return res.status(200).json({ message: "Template deleted" });
    } catch (error) {
        return res.status(500).json({ message: "Error delete letter" });
    }
}