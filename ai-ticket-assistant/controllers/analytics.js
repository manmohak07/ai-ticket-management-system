
import Ticket from "../models/ticket.js";
import User from "../models/user.js";

// Get AI Analytics Data
export const getAnalytics = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }

        const stats = {
            total: 0,
            status: {},
            priority: {},
            skills: [],
            moderators: []
        };

        // 1. Basic Counts
        const totalTickets = await Ticket.countDocuments();
        stats.total = totalTickets;

        const statusCounts = await Ticket.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        statusCounts.forEach(s => stats.status[s._id] = s.count);

        const priorityCounts = await Ticket.aggregate([
            { $group: { _id: "$priority", count: { $sum: 1 } } }
        ]);
        priorityCounts.forEach(p => stats.priority[p._id || "none"] = p.count);

        // 2. Top Skills
        const skillCounts = await Ticket.aggregate([
            { $unwind: "$relatedSkills" },
            { $group: { _id: "$relatedSkills", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        stats.skills = skillCounts;

        // 3. User Stats
        const modStats = await User.aggregate([
            { $match: { role: { $in: ["moderator", "admin"] } } },
            {
                $lookup: {
                    from: "tickets",
                    localField: "_id",
                    foreignField: "assignedTo",
                    as: "assignedTickets"
                }
            },
            {
                $project: {
                    email: 1,
                    role: 1,
                    ticketCount: { $size: "$assignedTickets" }
                }
            },
            { $sort: { ticketCount: -1 } },
            { $limit: 5 }
        ]);
        stats.moderators = modStats;

        return res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching analytics", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
