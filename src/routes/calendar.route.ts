import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { 
    createEvent, 
    getEvents, 
    deleteEvent, 
    getMySchedule // 👈 Import ini
} from "../controllers/calendar.controller";

const router = Router();

router.post("/", verifyToken, createEvent);
router.get("/", verifyToken, getEvents);
router.delete("/:id", verifyToken, deleteEvent);

// 👇 PASTIKAN INI ADA (Untuk widget 'Agenda Berikutnya' di dashboard)
router.get("/my-schedule", verifyToken, getMySchedule);

export default router;