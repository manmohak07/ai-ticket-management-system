import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    leaveType: {
        type: String,
        default: "personal",
        enum: ["sick", "vacation", "personal", "other"],
    },
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "approved", "rejected"],
    },
    adminNote: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Leave", leaveSchema);
