import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import { createAgent, gemini } from "@inngest/agent-kit";

export const analyzeComment = inngest.createFunction(
    { id: "analyze-comment", retries: 1 },
    { event: "comment/analyze" },
    async ({ event, step }) => {
        try {
            const { ticketId, commentText } = event.data;

            const ticket = await step.run("fetch-ticket", async () => {
                return await Ticket.findById(ticketId);
            });

            if (!ticket) {
                return { success: false, message: "Ticket not found" };
            }

            // AI Analysis
            // Note: agent.run() uses Inngest steps internally. Do NOT wrap in step.run().
            const agent = createAgent({
                model: gemini({
                    model: "gemini-2.0-flash",
                    apiKey: process.env.GEMINI_API_KEY,
                }),
                name: "Comment Analyzer",
            });

            const prompt = `Analyze this comment from an assignee working on a support ticket.

Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}
Current Status: ${ticket.status}

Assignee's Comment: "${commentText}"

Determine if this comment indicates:
1. "COMPLETE" - The issue is fully resolved and ready for review
2. "IN_PROGRESS" - Work is ongoing, may mention progress updates or blockers
3. "NEEDS_INFO" - Assignee needs more information from the reporter
4. "RETURNED" - Issue needs to be reassigned or sent back to reporter

Respond ONLY with one of these exact words: COMPLETE, IN_PROGRESS, NEEDS_INFO, or RETURNED`;

            const response = await agent.run(prompt);
            const output = response.output?.toUpperCase() || "";

            let analysis = "IN_PROGRESS";
            if (output.includes("COMPLETE")) analysis = "COMPLETE";
            else if (output.includes("NEEDS_INFO")) analysis = "NEEDS_INFO";
            else if (output.includes("RETURNED")) analysis = "RETURNED";
            else if (output.includes("IN_PROGRESS")) analysis = "IN_PROGRESS";

            // Update ticket status based on AI analysis
            await step.run("update-ticket-status", async () => {
                let newStatus = ticket.status;

                if (analysis === "COMPLETE") {
                    newStatus = "DONE";
                } else if (analysis === "IN_PROGRESS") {
                    newStatus = "IN_PROGRESS";
                } else if (analysis === "NEEDS_INFO" || analysis === "RETURNED") {
                    newStatus = "TODO";
                }

                await Ticket.findByIdAndUpdate(ticketId, {
                    status: newStatus,
                    $push: {
                        comments: {
                            text: `[SYSTEM NOTIFICATION]: AI Analyzer has reviewed the latest progress. Ticket status has been updated to: ${newStatus}. Status Reason: ${analysis}`,
                            createdAt: new Date()
                        }
                    }
                });
                return newStatus;
            });

            return { success: true, analysis, ticketId };
        } catch (error) {
            console.error("❌ Error analyzing comment:", error.message);
            return { success: false, error: error.message };
        }
    }
);
