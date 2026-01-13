import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Tickets() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [user, setUser] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setForm({ title: "", description: "" });
        fetchTickets();
      } else {
        alert(data.message || "Ticket creation failed");
      }
    } catch (err) {
      alert("Error creating ticket");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "badge-error";
      case "medium":
        return "badge-warning";
      case "low":
        return "badge-success";
      default:
        return "badge-ghost";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "badge-info";
      case "DONE":
        return "badge-success";
      case "TODO":
        return "badge-warning";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <div>
              <h1 className="text-xl font-bold">Dashboard</h1>
              {user && (
                <p className="text-sm text-gray-500">
                  {user.email} • <span className="capitalize">{user.role}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-full border border-gray-700 hover:bg-gray-900 transition-colors text-sm font-medium"
              >
                Admin Panel
              </Link>
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
        {/* Create Ticket Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Create New Ticket</h2>
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4"
          >
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ticket Title"
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your issue in detail..."
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 transition-colors min-h-[120px] resize-none"
              required
            />
            <button
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Submit Ticket"}
            </button>
          </form>
        </div>

        {/* Tickets List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {user?.role === "admin"
              ? "All Tickets"
              : user?.role === "moderator"
                ? "Assigned to You"
                : "Your Tickets"}
          </h2>
          <div className="space-y-4">
            {fetching ? (
              // Skeleton Loaders
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-800 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </div>
              ))
            ) : tickets.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-700 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-gray-500 text-lg">No tickets yet</p>
                <p className="text-gray-600 text-sm mt-2">
                  Create your first ticket to get started
                </p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <Link
                  key={ticket._id}
                  to={`/tickets/${ticket._id}`}
                  className="block bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all hover:bg-gray-900/70"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold">{ticket.title}</h3>
                    <div className="flex gap-2">
                      {ticket.priority && (
                        <span
                          className={`badge ${getPriorityColor(
                            ticket.priority
                          )} badge-sm`}
                        >
                          {ticket.priority}
                        </span>
                      )}
                      {ticket.status && (
                        <span
                          className={`badge ${getStatusColor(
                            ticket.status
                          )} badge-sm`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {ticket.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex gap-4">
                      {ticket.assignedTo && (
                        <span>👤 {ticket.assignedTo.email}</span>
                      )}
                      {ticket.createdBy && (
                        <span>📝 {ticket.createdBy.email}</span>
                      )}
                    </div>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
