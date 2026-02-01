import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { getCategories, createCategory, deleteCategory } from "../controllers/category.controller";

const router = Router();
router.get("/", verifyToken, getCategories);
router.post("/", verifyToken, createCategory);
router.delete("/:id", verifyToken, deleteCategory);

export default router;