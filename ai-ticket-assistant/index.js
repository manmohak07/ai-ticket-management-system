import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { serve } from "inngest/express";
import userRoutes from "./routes/user.js";
import ticketRoutes from "./routes/ticket.js";
import { inngest } from "./inngest/client.js";
import { onUserSignup } from "./inngest/functions/on-signup.js";
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js";
import { analyzeComment } from "./inngest/functions/analyze-comment.js";

import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/tickets", ticketRoutes);

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [onUserSignup, onTicketCreated, analyzeComment],
  })
);

// Start server immediately so frontend can connect
const server = app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});

// Connect to MongoDB with timeout
console.log("Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000, // 10s timeout
  })
  .then(() => {
    console.log("MongoDB connected ✅");
  })
  .catch((err) => {
    console.error("❌ MongoDB error: ", err.message);
    console.log("Keep-alive: Server is still running but DB features will fail.");
    // Disable buffering if connection fails so requests don't hang
    mongoose.set('bufferCommands', false);
  });
