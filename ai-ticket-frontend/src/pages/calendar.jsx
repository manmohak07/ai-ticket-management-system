import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

const LEAVE_COLORS = {
    approved: { bg: "rgba(34,197,94,0.25)", border: "#22c55e", text: "#4ade80", label: "Approved" },
    pending: { bg: "rgba(234,179,8,0.25)", border: "#eab308", text: "#facc15", label: "Pending" },
    rejected: { bg: "rgba(239,68,68,0.25)", border: "#ef4444", text: "#f87171", label: "Rejected" },
};

const LEAVE_TYPE_ICONS = {
    sick: "🤒",
    vacation: "🏖️",
    personal: "👤",
    other: "📋",
};

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [leaves, setLeaves] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [applyForm, setApplyForm] = useState({
        startDate: "",
        endDate: "",
        reason: "",
        leaveType: "personal",
    });
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);
    const [hoveredLeave, setHoveredLeave] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [user, setUser] = useState(null);

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [currentDate]);

    useEffect(() => {
        fetchMyLeaves();
    }, []);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            const res = await fetch(
                `${import.meta.env.VITE_SERVER_URL}/leaves?month=${month}&year=${year}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (res.ok) setLeaves(data.leaves || []);
        } catch (err) {
            console.error("Failed to fetch leaves:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyLeaves = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_SERVER_URL}/leaves/my`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (res.ok) setMyLeaves(data.leaves || []);
        } catch (err) {
            console.error("Failed to fetch my leaves:", err);
        }
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/leaves`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(applyForm),
            });
            const data = await res.json();
            if (res.ok) {
                showToast("Leave request submitted successfully!");
                setShowApplyModal(false);
                setApplyForm({ startDate: "", endDate: "", reason: "", leaveType: "personal" });
                fetchLeaves();
                fetchMyLeaves();
            } else {
                showToast(data.message || "Failed to submit leave", "error");
            }
        } catch (err) {
            showToast("Error submitting leave request", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLeaveAction = async (leaveId, action) => {
        setActionLoading(leaveId);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_SERVER_URL}/leaves/${leaveId}/${action}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ adminNote: "" }),
                }
            );
            const data = await res.json();
            if (res.ok) {
                showToast(`Leave ${action === "approve" ? "approved" : "rejected"} successfully!`);
                fetchLeaves();
                fetchMyLeaves();
            } else {
                showToast(data.message || `Failed to ${action}`, "error");
            }
        } catch (err) {
            showToast(`Error: ${err.message}`, "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteLeave = async (leaveId) => {
        if (!confirm("Are you sure you want to cancel this leave request?")) return;
        try {
            const res = await fetch(
                `${import.meta.env.VITE_SERVER_URL}/leaves/${leaveId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.ok) {
                showToast("Leave request cancelled");
                fetchLeaves();
                fetchMyLeaves();
            }
        } catch (err) {
            showToast("Failed to cancel leave", "error");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    // Calendar computation
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const days = [];

        // Previous month trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
        }

        // Next month leading days
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
        }

        return days;
    }, [currentDate]);

    // Get leaves for a specific date
    const getLeavesForDate = (date) => {
        return leaves.filter((leave) => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            const checkDate = new Date(date);
            checkDate.setHours(12, 0, 0, 0);
            return checkDate >= start && checkDate <= end && leave.status === "approved";
        });
    };

    // Get pending leaves for admin
    const pendingLeaves = useMemo(() => {
        return leaves.filter((l) => l.status === "pending");
    }, [leaves]);

    const isToday = (date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Unique colors per user for leave bars
    const userColorMap = useMemo(() => {
        const colors = [
            "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
            "#14b8a6", "#06b6d4", "#3b82f6", "#f97316", "#84cc16",
        ];
        const map = {};
        let idx = 0;
        leaves.forEach((l) => {
            const uid = l.user?._id;
            if (uid && !map[uid]) {
                map[uid] = colors[idx % colors.length];
                idx++;
            }
        });
        return map;
    }, [leaves]);

    return (
        <div className="min-h-screen bg-black text-gray-100">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all duration-300 animate-slideIn ${toast.type === "error"
                            ? "bg-red-500/20 border border-red-500/40 text-red-400"
                            : "bg-green-500/20 border border-green-500/40 text-green-400"
                        }`}
                >
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                        </svg>
                        <div>
                            <h1 className="text-xl font-bold">Team Calendar</h1>
                            {user && (
                                <p className="text-sm text-gray-500">
                                    {user.email} • <span className="capitalize">{user.role}</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 rounded-full border border-gray-700 hover:bg-gray-900 transition-colors text-sm font-medium"
                        >
                            Dashboard
                        </Link>
                        {user?.role === "admin" && (
                            <>
                                <Link
                                    to="/admin"
                                    className="px-4 py-2 rounded-full border border-gray-700 hover:bg-gray-900 transition-colors text-sm font-medium"
                                >
                                    Admin Panel
                                </Link>
                                <Link
                                    to="/analytics"
                                    className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 hover:border-blue-500/50 transition-colors text-sm font-medium"
                                >
                                    Analytics
                                </Link>
                            </>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium border border-red-500/20"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Top Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        {/* Month Navigation */}
                        <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-1">
                            <button
                                onClick={prevMonth}
                                className="w-10 h-10 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={goToToday}
                                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                            >
                                Today
                            </button>
                            <button
                                onClick={nextMonth}
                                className="w-10 h-10 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                    </div>

                    <div className="flex gap-3">
                        {user?.role === "admin" && pendingLeaves.length > 0 && (
                            <button
                                onClick={() => setShowAdminPanel(!showAdminPanel)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:border-amber-500/50 transition-all text-sm font-medium flex items-center gap-2"
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                                Pending Requests ({pendingLeaves.length})
                            </button>
                        )}
                        <button
                            onClick={() => setShowApplyModal(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all text-sm font-semibold shadow-lg shadow-purple-500/25 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Apply for Leave
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6">
                    {Object.entries(LEAVE_COLORS).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-2 text-xs text-gray-400">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color.border }}
                            />
                            {color.label}
                        </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-400/50" />
                        Today
                    </div>
                </div>

                {/* Admin Pending Panel */}
                {showAdminPanel && user?.role === "admin" && (
                    <div className="mb-8 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6 animate-fadeIn">
                        <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pending Leave Requests
                        </h3>
                        <div className="space-y-3">
                            {pendingLeaves.map((leave) => (
                                <div
                                    key={leave._id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 border border-gray-800 rounded-xl p-4"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-white">{leave.user?.email}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 capitalize">
                                                {leave.leaveType || "personal"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            {new Date(leave.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            {" → "}
                                            {new Date(leave.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">"{leave.reason}"</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleLeaveAction(leave._id, "approve")}
                                            disabled={actionLoading === leave._id}
                                            className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                                        >
                                            {actionLoading === leave._id ? "..." : "✓ Approve"}
                                        </button>
                                        <button
                                            onClick={() => handleLeaveAction(leave._id, "reject")}
                                            disabled={actionLoading === leave._id}
                                            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                                        >
                                            {actionLoading === leave._id ? "..." : "✗ Reject"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Calendar Grid */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-gray-800">
                        {DAY_NAMES.map((day) => (
                            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    {loading ? (
                        <div className="grid grid-cols-7">
                            {Array.from({ length: 42 }).map((_, i) => (
                                <div key={i} className="h-28 border-b border-r border-gray-800/50 p-2 animate-pulse">
                                    <div className="w-6 h-6 rounded-full bg-gray-800/50" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-7">
                            {calendarData.map((dayInfo, idx) => {
                                const dayLeaves = getLeavesForDate(dayInfo.date);
                                const today = isToday(dayInfo.date);
                                return (
                                    <div
                                        key={idx}
                                        className={`h-28 border-b border-r border-gray-800/50 p-1.5 transition-colors relative group ${dayInfo.currentMonth ? "bg-transparent" : "bg-gray-950/40"
                                            } ${today ? "bg-blue-500/5" : ""} hover:bg-gray-800/30`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium ${today
                                                        ? "bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30"
                                                        : dayInfo.currentMonth
                                                            ? "text-gray-300"
                                                            : "text-gray-600"
                                                    }`}
                                            >
                                                {dayInfo.day}
                                            </span>
                                            {dayLeaves.length > 0 && (
                                                <span className="text-[10px] text-gray-500 font-medium">
                                                    {dayLeaves.length} off
                                                </span>
                                            )}
                                        </div>
                                        {/* Leave indicators */}
                                        <div className="space-y-0.5 overflow-hidden">
                                            {dayLeaves.slice(0, 3).map((leave, i) => {
                                                const color = userColorMap[leave.user?._id] || "#6366f1";
                                                return (
                                                    <div
                                                        key={leave._id + i}
                                                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate cursor-pointer transition-all hover:scale-[1.02]"
                                                        style={{
                                                            backgroundColor: `${color}22`,
                                                            borderLeft: `2px solid ${color}`,
                                                            color: color,
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            setHoveredLeave(leave);
                                                            setTooltipPos({ x: e.clientX, y: e.clientY });
                                                        }}
                                                        onMouseLeave={() => setHoveredLeave(null)}
                                                    >
                                                        {leave.user?.email?.split("@")[0]}
                                                    </div>
                                                );
                                            })}
                                            {dayLeaves.length > 3 && (
                                                <p className="text-[10px] text-gray-500 pl-1">+{dayLeaves.length - 3} more</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Tooltip */}
                {hoveredLeave && (
                    <div
                        className="fixed z-[80] bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl pointer-events-none min-w-[240px]"
                        style={{
                            left: tooltipPos.x + 16,
                            top: tooltipPos.y - 80,
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{LEAVE_TYPE_ICONS[hoveredLeave.leaveType] || "📋"}</span>
                            <span className="font-medium">{hoveredLeave.user?.email}</span>
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                            <p>
                                <span className="text-gray-500">Type:</span>{" "}
                                <span className="capitalize">{hoveredLeave.leaveType}</span>
                            </p>
                            <p>
                                <span className="text-gray-500">From:</span>{" "}
                                {new Date(hoveredLeave.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <p>
                                <span className="text-gray-500">To:</span>{" "}
                                {new Date(hoveredLeave.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                            <p>
                                <span className="text-gray-500">Reason:</span> {hoveredLeave.reason}
                            </p>
                            <div className="mt-2">
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full border"
                                    style={{
                                        backgroundColor: LEAVE_COLORS[hoveredLeave.status]?.bg,
                                        borderColor: LEAVE_COLORS[hoveredLeave.status]?.border,
                                        color: LEAVE_COLORS[hoveredLeave.status]?.text,
                                    }}
                                >
                                    {hoveredLeave.status}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Leaves Section */}
                <div className="mt-10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Leave Requests
                    </h3>
                    {myLeaves.length === 0 ? (
                        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 text-center">
                            <p className="text-gray-500">No leave requests yet</p>
                            <p className="text-gray-600 text-sm mt-1">Click "Apply for Leave" to get started</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {myLeaves.map((leave) => (
                                <div
                                    key={leave._id}
                                    className="bg-gray-900/30 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{LEAVE_TYPE_ICONS[leave.leaveType] || "📋"}</span>
                                            <span className="text-sm font-medium capitalize">{leave.leaveType}</span>
                                        </div>
                                        <span
                                            className="text-xs px-2.5 py-1 rounded-full border font-medium"
                                            style={{
                                                backgroundColor: LEAVE_COLORS[leave.status]?.bg,
                                                borderColor: LEAVE_COLORS[leave.status]?.border,
                                                color: LEAVE_COLORS[leave.status]?.text,
                                            }}
                                        >
                                            {leave.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-1">
                                        {new Date(leave.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        {" → "}
                                        {new Date(leave.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">"{leave.reason}"</p>
                                    {leave.adminNote && (
                                        <p className="text-xs text-gray-500 italic mb-2">Admin note: {leave.adminNote}</p>
                                    )}
                                    {leave.status === "pending" && (
                                        <button
                                            onClick={() => handleDeleteLeave(leave._id)}
                                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            Cancel Request
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* All Upcoming Leaves (Sidebar-style) */}
                <div className="mt-10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Team Leave Overview — {MONTH_NAMES[currentDate.getMonth()]}
                    </h3>
                    {leaves.filter(l => l.status === "approved").length === 0 ? (
                        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 text-center">
                            <p className="text-gray-500">No approved leaves this month</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {leaves
                                .filter(l => l.status === "approved")
                                .map((leave) => {
                                    const color = userColorMap[leave.user?._id] || "#6366f1";
                                    return (
                                        <div
                                            key={leave._id}
                                            className="flex items-center gap-4 bg-gray-900/30 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-all"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                                style={{ backgroundColor: `${color}22`, color: color }}
                                            >
                                                {leave.user?.email?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{leave.user?.email}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(leave.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                    {" → "}
                                                    {new Date(leave.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                    {" • "}
                                                    <span className="capitalize">{leave.leaveType}</span>
                                                </p>
                                            </div>
                                            <span className="text-lg shrink-0">{LEAVE_TYPE_ICONS[leave.leaveType] || "📋"}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </main>

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowApplyModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl animate-scaleIn">
                        <button
                            onClick={() => setShowApplyModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="text-xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Apply for Leave
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Submit a leave request for admin approval</p>
                        <form onSubmit={handleApplyLeave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={applyForm.startDate}
                                        onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={applyForm.endDate}
                                        onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                                        min={applyForm.startDate}
                                        className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Leave Type</label>
                                <select
                                    value={applyForm.leaveType}
                                    onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    <option value="personal">👤 Personal</option>
                                    <option value="sick">🤒 Sick Leave</option>
                                    <option value="vacation">🏖️ Vacation</option>
                                    <option value="other">📋 Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Reason</label>
                                <textarea
                                    required
                                    value={applyForm.reason}
                                    onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                                    placeholder="Briefly describe the reason..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 bg-black border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                            >
                                {submitting ? "Submitting..." : "Submit Leave Request"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
        </div>
    );
}
