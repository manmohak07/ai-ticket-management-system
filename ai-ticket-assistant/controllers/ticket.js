import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }
    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
      relatedSkills: req.body.relatedSkills,
    });

    await inngest.send({
      name: "ticket/created",
      data: {
        ticketId: newTicket._id.toString(),
        title,
        description,
        createdBy: req.user._id.toString(),
      },
    });
    return res.status(201).json({
      message: "Ticket created and processing started",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];

    if (user.role === "admin") {
      // Admin sees all tickets
      tickets = await Ticket.find({})
        .populate("assignedTo", ["email", "_id", "role"])
        .populate("createdBy", ["email", "_id", "role"])
        .sort({ createdAt: -1 });
    } else if (user.role === "moderator") {
      // Moderator sees: tickets assigned to them OR tickets they created OR tickets matching their skills
      const userDoc = await User.findById(user._id);
      const skillsRegex = userDoc.skills.map(skill => new RegExp(skill, 'i'));

      tickets = await Ticket.find({
        $or: [
          { assignedTo: user._id }, // Assigned to them
          { createdBy: user._id },  // Created by them
          { relatedSkills: { $in: skillsRegex } } // Matches their skills
        ]
      })
        .populate("assignedTo", ["email", "_id", "role"])
        .populate("createdBy", ["email", "_id", "role"])
        .sort({ createdAt: -1 });
    } else {
      // User sees: tickets they created OR tickets assigned to them
      tickets = await Ticket.find({
        $or: [
          { createdBy: user._id },
          { assignedTo: user._id }
        ]
      })
        .populate("assignedTo", ["email", "_id", "role"])
        .populate("createdBy", ["email", "_id", "role"])
        .sort({ createdAt: -1 });
    }
    return res.status(200).json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;

    if (user.role === "admin") {
      ticket = await Ticket.findById(req.params.id)
        .populate("assignedTo", ["email", "_id", "role"])
        .populate("createdBy", ["email", "_id", "role"])
        .populate("comments.user", ["email", "_id", "role"]);
    } else if (user.role === "moderator") {
      // Moderator can see if assigned OR created OR skills match
      const userDoc = await User.findById(user._id);
      const skillsRegex = userDoc.skills.map(skill => new RegExp(skill, 'i'));

      ticket = await Ticket.findOne({
        _id: req.params.id,
        $or: [
          { assignedTo: user._id },
          { createdBy: user._id },
          { relatedSkills: { $in: skillsRegex } }
        ]
      })
        .populate("assignedTo", ["email", "_id", "role"])
        .populate("createdBy", ["email", "_id", "role"])
        .populate("comments.user", ["email", "_id", "role"]);
    } else {
      // User can see if created OR assigned
      ticket = await Ticket.findOne({
        _id: req.params.id,
        $or: [
          { createdBy: user._id },
          { assignedTo: user._id }
        ]
      })
        .populate("assignedTo", ["email", "_id", "role"])
        .populate("createdBy", ["email", "_id", "role"])
        .populate("comments.user", ["email", "_id", "role"]);
    }

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Admin: Update ticket assignment
export const updateTicketAssignment = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { ticketId, assignedTo } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { assignedTo: assignedTo || null },
      { new: true }
    )
      .populate("assignedTo", ["email", "_id", "role"])
      .populate("createdBy", ["email", "_id", "role"]);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({ ticket, message: "Ticket reassigned successfully" });
  } catch (error) {
    console.error("Error updating ticket assignment", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Admin: Delete ticket
export const deleteTicket = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add comment to ticket
export const addComment = async (req, res) => {
  try {
    const { ticketId, text } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Check if user has access to this ticket
    const user = req.user;
    const hasAccess =
      user.role === "admin" ||
      ticket.assignedTo?.toString() === user._id.toString() ||
      ticket.createdBy?.toString() === user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    ticket.comments = ticket.comments || [];
    ticket.comments.push({
      user: user._id,
      text,
      createdAt: new Date()
    });

    await ticket.save();

    // Trigger AI analysis of comment if from assignee
    if (ticket.assignedTo?.toString() === user._id.toString()) {
      await inngest.send({
        name: "comment/analyze",
        data: {
          ticketId: ticket._id.toString(),
          commentText: text,
          userId: user._id.toString()
        }
      });
    }

    const updatedTicket = await Ticket.findById(ticketId)
      .populate("assignedTo", ["email", "_id", "role"])
      .populate("createdBy", ["email", "_id", "role"])
      .populate("comments.user", ["email", "_id", "role"]);

    return res.status(200).json({ ticket: updatedTicket });
  } catch (error) {
    console.error("Error adding comment", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
