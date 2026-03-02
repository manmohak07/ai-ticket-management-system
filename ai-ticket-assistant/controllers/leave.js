import Leave from "../models/leave.js";
import User from "../models/user.js";

// Apply for leave (any authenticated user)
export const applyLeave = async (req, res) => {
    try {
        const { startDate, endDate, reason, leaveType } = req.body;

        if (!startDate || !endDate || !reason) {
            return res.status(400).json({ message: "Start date, end date, and reason are required" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            return res.status(400).json({ message: "End date must be after start date" });
        }

        // Check for overlapping approved/pending leaves for this user
        const overlapping = await Leave.findOne({
            user: req.user._id,
            status: { $in: ["pending", "approved"] },
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } },
            ],
        });

        if (overlapping) {
            return res.status(400).json({
                message: "You already have an overlapping leave request for these dates",
            });
        }

        const leave = await Leave.create({
            user: req.user._id,
            startDate: start,
            endDate: end,
            reason,
            leaveType: leaveType || "personal",
        });

        const populated = await Leave.findById(leave._id)
            .populate("user", ["email", "_id", "role"]);

        return res.status(201).json({ message: "Leave request submitted", leave: populated });
    } catch (error) {
        console.error("Error applying for leave:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get all leaves (for global calendar view — all authenticated users can see)
export const getAllLeaves = async (req, res) => {
    try {
        const { month, year, status } = req.query;

        let filter = {};

        // If month and year are provided, filter leaves that overlap with that month
        if (month !== undefined && year !== undefined) {
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, parseInt(month) + 1, 0, 23, 59, 59);
            filter.$or = [
                { startDate: { $lte: monthEnd }, endDate: { $gte: monthStart } },
            ];
        }

        // Optionally filter by status
        if (status) {
            filter.status = status;
        }

        const leaves = await Leave.find(filter)
            .populate("user", ["email", "_id", "role"])
            .populate("reviewedBy", ["email", "_id"])
            .sort({ startDate: 1 });

        return res.status(200).json({ leaves });
    } catch (error) {
        console.error("Error fetching leaves:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get current user's leaves
export const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ user: req.user._id })
            .populate("user", ["email", "_id", "role"])
            .populate("reviewedBy", ["email", "_id"])
            .sort({ createdAt: -1 });

        return res.status(200).json({ leaves });
    } catch (error) {
        console.error("Error fetching user leaves:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Approve leave (admin only)
export const approveLeave = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const { adminNote } = req.body;

        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({ message: `Leave is already ${leave.status}` });
        }

        leave.status = "approved";
        leave.adminNote = adminNote || "";
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = new Date();
        await leave.save();

        const populated = await Leave.findById(leave._id)
            .populate("user", ["email", "_id", "role"])
            .populate("reviewedBy", ["email", "_id"]);

        return res.status(200).json({ message: "Leave approved", leave: populated });
    } catch (error) {
        console.error("Error approving leave:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Reject leave (admin only)
export const rejectLeave = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const { adminNote } = req.body;

        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        if (leave.status !== "pending") {
            return res.status(400).json({ message: `Leave is already ${leave.status}` });
        }

        leave.status = "rejected";
        leave.adminNote = adminNote || "";
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = new Date();
        await leave.save();

        const populated = await Leave.findById(leave._id)
            .populate("user", ["email", "_id", "role"])
            .populate("reviewedBy", ["email", "_id"]);

        return res.status(200).json({ message: "Leave rejected", leave: populated });
    } catch (error) {
        console.error("Error rejecting leave:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Delete/Cancel leave (admin or owner if still pending)
export const deleteLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        const isAdmin = req.user.role === "admin";
        const isOwner = leave.user.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Non-admin can only cancel pending leaves
        if (!isAdmin && leave.status !== "pending") {
            return res.status(400).json({ message: "Can only cancel pending leave requests" });
        }

        await Leave.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Leave request deleted" });
    } catch (error) {
        console.error("Error deleting leave:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Utility: Check if a user is on approved leave on a given date
export const isUserOnLeave = async (userId, date = new Date()) => {
    const leave = await Leave.findOne({
        user: userId,
        status: "approved",
        startDate: { $lte: date },
        endDate: { $gte: date },
    });
    return !!leave;
};

// Utility: Get all user IDs who are on approved leave on a given date
export const getUsersOnLeave = async (date = new Date()) => {
    const leaves = await Leave.find({
        status: "approved",
        startDate: { $lte: date },
        endDate: { $gte: date },
    }).select("user");
    return leaves.map((l) => l.user.toString());
};
