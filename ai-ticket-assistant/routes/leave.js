import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
    applyLeave,
    getAllLeaves,
    getMyLeaves,
    approveLeave,
    rejectLeave,
    deleteLeave,
} from "../controllers/leave.js";

const router = express.Router();

router.post("/", authenticate, applyLeave);
router.get("/", authenticate, getAllLeaves);
router.get("/my", authenticate, getMyLeaves);
router.put("/:id/approve", authenticate, approveLeave);
router.put("/:id/reject", authenticate, rejectLeave);
router.delete("/:id", authenticate, deleteLeave);

export default router;
