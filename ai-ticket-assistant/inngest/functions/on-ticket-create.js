import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import analyzeTicket from "../../utils/ai.js";
import { sendMail } from "../../utils/mailer.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-create", retries: 3 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) throw new Error("Ticket not found");
        return ticketObject;
      });

      // 1. Initial Status
      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
        return "TODO";
      });

      // 2. AI Analysis
      // Note: analyzeTicket uses Inngest Agent Kit which manages its own steps.
      // Do NOT wrap it in step.run() as nesting steps is not supported.
      const aiResponse = await analyzeTicket(ticket);

      const skillsFound = await step.run("ai-processing", async () => {
        const updateData = {
          priority: ["low", "medium", "high"].includes(aiResponse.priority?.toLowerCase())
            ? aiResponse.priority.toLowerCase()
            : "medium",
          helpfulNotes: aiResponse.helpfulNotes,
          status: "IN_PROGRESS",
          relatedSkills: Array.isArray(aiResponse.relatedSkills) ? aiResponse.relatedSkills : [],
        };

        await Ticket.findByIdAndUpdate(ticket._id, updateData);
        return updateData.relatedSkills;
      });

      // 3. Intelligent Assignment
      const assignedUser = await step.run("assign-moderator", async () => {
        // Find all users with any matching skills
        const potentialAssignees = await User.find({
          role: { $in: ["moderator", "admin"] },
          skills: { $in: skillsFound.map(s => new RegExp(s, "i")) }
        });

        let assignee = null;
        if (potentialAssignees.length > 0) {
          // Pick a random one from matching candidates
          assignee = potentialAssignees[Math.floor(Math.random() * potentialAssignees.length)];
        } else {
          // Fallback to any random moderator if no skill matches
          const anyMod = await User.find({ role: "moderator" });
          if (anyMod.length > 0) {
            assignee = anyMod[Math.floor(Math.random() * anyMod.length)];
          } else {
            // Fallback to first admin
            assignee = await User.findOne({ role: "admin" });
          }
        }

        if (assignee) {
          await Ticket.findByIdAndUpdate(ticket._id, { assignedTo: assignee._id });
        }
        return assignee;
      });

      // 4. Notification
      if (assignedUser) {
        await step.run("send-notification", async () => {
          await sendMail(
            assignedUser.email,
            `Ticket Assigned: ${ticket.title}`,
            `Hi, you have been assigned a new ticket.\n\nPriority: ${aiResponse.priority}\nSummary: ${aiResponse.summary}\n\nPlease check your dashboard for details.`
          );
          return { sent: true, to: assignedUser.email };
        });
      }

      return { success: true, assignedTo: assignedUser?.email };
    } catch (error) {
      console.error("Inngest Ticket Create Error:", error);
      return { success: false, error: error.message };
    }
  }
);
