
import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { getAnalytics } from "../controllers/analytics.js";

const router = express.Router();

router.get("/", authenticate, getAnalytics);

export default router;
