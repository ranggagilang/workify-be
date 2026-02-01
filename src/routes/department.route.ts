import express from "express";
import { getDepartments, createDepartment } from "../controllers/department.controller";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware";

const router = express.Router();

// Middleware: Harus Login & Harus Admin
router.get("/", verifyToken, isAdmin, getDepartments);
router.post("/", verifyToken, isAdmin, createDepartment);

export default router;