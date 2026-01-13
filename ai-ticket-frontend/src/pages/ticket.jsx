import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [users, setUsers] = useState([]);
  const [reassigning, setReassigning] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchTicket();
    if (user.role === "admin") {
      fetchUsers();
    }
  }, [id]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/tickets/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setTicket(data.ticket);
      } else {
        alert(data.message || "Failed to fetch ticket");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching ticket");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSendingComment(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/tickets/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ticketId: id, text: comment }),
        }
      );

      if (res.ok) {
        setComment("");
        fetchTicket(); // Refresh to show new comment
      } else {
        const data = await res.json();
        alert(data.message || "Failed to add comment");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding comment");
    } finally {
      setSendingComment(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedUser) return;

    setReassigning(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/tickets/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ticketId: id,
            assignedTo: selectedUser,
          }),
        }
      );

      if (res.ok) {
        fetchTicket();
        setSelectedUser("");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to reassign ticket");
      }
    } catch (err) {
      console.error(err);
      alert("Error reassigning ticket");
    } finally {
      setReassigning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/tickets/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        navigate("/dashboard");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete ticket");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting ticket");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-12 w-12 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-400">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">Ticket not found</p>
          <Link to="/dashboard" className="text-blue-500 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DONE":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "IN_PROGRESS":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "TODO":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/dashboard"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
          {user.role === "admin" && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium border border-red-500/20"
            >
              Delete Ticket
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Ticket Header */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{ticket.title}</h1>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm border ${getPriorityColor(
                  ticket.priority
                )}`}
              >
                {ticket.priority?.toUpperCase() || "MEDIUM"}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(
                  ticket.status
                )}`}
              >
                {ticket.status?.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <span className="font-medium">Created by:</span>{" "}
              {ticket.createdBy?.email}
            </div>
            <div>
              <span className="font-medium">Assigned to:</span>{" "}
              {ticket.assignedTo?.email || "Unassigned"}
            </div>
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(ticket.createdAt).toLocaleString()}
            </div>
            {ticket.relatedSkills && ticket.relatedSkills.length > 0 && (
              <div>
                <span className="font-medium">Skills:</span>{" "}
                {ticket.relatedSkills.join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Description</h2>
          <p className="text-gray-300 whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {/* Helpful Notes (AI Analysis) */}
        {ticket.helpfulNotes && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">
              AI Analysis & Resolution Guide
            </h2>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
              <ReactMarkdown>
                {ticket.helpfulNotes}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Admin: Reassign Ticket */}
        {user.role === "admin" && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Reassign Ticket</h2>
            <div className="flex gap-3">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex-1 px-4 py-3 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="">Select user...</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.email} ({u.role}) - {u.skills?.length > 0 ? u.skills.join(", ") : "No skills listed"}
                  </option>
                ))}
              </select>
              <button
                onClick={handleReassign}
                disabled={!selectedUser || reassigning}
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reassigning ? "Reassigning..." : "Change Assignee"}
              </button>
            </div>
          </div>
        )}

        {/* Status Decided by AI (Informational) */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Progress Intelligence</h2>
          <p className="text-sm text-gray-400 italic">
            Note: Status is automatically managed by our AI agent based on the comments provided by the assignee.
          </p>
        </div>

        {/* Comments Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Comments</h2>

          {/* Existing Comments */}
          <div className="space-y-4 mb-6">
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((c, idx) => (
                <div
                  key={idx}
                  className="bg-black/50 border border-gray-800 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-blue-400">
                      {c.user?.email}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{c.text}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
              disabled={sendingComment}
            />
            <button
              type="submit"
              disabled={!comment.trim() || sendingComment}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingComment ? "Posting..." : "Post Comment"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
