import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import analyzeTicket from "../../utils/ai.js";
import { sendMail } from "../../utils/mailer.js";
import { getUsersOnLeave } from "../../controllers/leave.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-create", retries: 3 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;
      console.log(`[Inngest]: Received ticket/created event for ID: ${ticketId}`);

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
      const aiResponse = await step.run("analyze-ticket-content", async () => {
        return await analyzeTicket(ticket);
      });

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

      // 3. Intelligent Assignment (with leave calendar awareness)
      const assignedUser = await step.run("assign-moderator", async () => {
        // Get all user IDs who are on approved leave today
        const onLeaveUserIds = await getUsersOnLeave(new Date());
        console.log(`[Inngest]: Users currently on leave: ${onLeaveUserIds.length}`);

        // Find all users with any matching skills, excluding those on leave
        const potentialAssignees = await User.find({
          role: { $in: ["moderator", "admin"] },
          skills: { $in: skillsFound.map(s => new RegExp(s, "i")) },
          _id: { $nin: onLeaveUserIds },
        });

        let assignee = null;
        if (potentialAssignees.length > 0) {
          // Pick a random one from matching candidates
          assignee = potentialAssignees[Math.floor(Math.random() * potentialAssignees.length)];
        } else {
          // Fallback to any random moderator not on leave
          const anyMod = await User.find({
            role: "moderator",
            _id: { $nin: onLeaveUserIds },
          });
          if (anyMod.length > 0) {
            assignee = anyMod[Math.floor(Math.random() * anyMod.length)];
          } else {
            // Fallback to any admin not on leave
            assignee = await User.findOne({
              role: "admin",
              _id: { $nin: onLeaveUserIds },
            });
          }
        }

        if (assignee) {
          console.log(`[Inngest]: Assigning ticket ${ticket._id} to ${assignee.email} (${assignee.role}) — verified not on leave`);
          await Ticket.findByIdAndUpdate(ticket._id, { assignedTo: assignee._id });
        } else {
          console.warn(`[Inngest]: No available assignee found for ticket ${ticket._id} (all matching users may be on leave)`);
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
