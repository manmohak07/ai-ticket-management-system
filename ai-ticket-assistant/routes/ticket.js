import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
    createTicket,
    getTicket,
    getTickets,
    updateTicketAssignment,
    deleteTicket,
    addComment
} from "../controllers/ticket.js";

const router = express.Router();

router.get("/", authenticate, getTickets);
router.get("/:id", authenticate, getTicket);
router.post("/", authenticate, createTicket);
router.post("/comment", authenticate, addComment);
router.put("/assign", authenticate, updateTicketAssignment);
router.delete("/:id", authenticate, deleteTicket);

export default router;
