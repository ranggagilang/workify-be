import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const cats = await prisma.eventCategory.findMany({ where: { companyId } });
    res.json({ data: cats });
  } catch (error) {
    res.status(500).json({ message: "Gagal ambil kategori" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const { name, color } = req.body;
    const cat = await prisma.eventCategory.create({
      data: { name, color, companyId }
    });
    res.status(201).json({ data: cat });
  } catch (error) {
    res.status(500).json({ message: "Gagal buat kategori" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.eventCategory.delete({ where: { id: Number(id) } });
    res.json({ message: "Kategori dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal hapus kategori" });
  }
};