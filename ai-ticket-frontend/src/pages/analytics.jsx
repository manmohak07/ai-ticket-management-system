
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Analytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            if (user.role !== "admin") {
                navigate("/dashboard");
                return;
            }

            try {
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen bg-black text-gray-100 p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-gray-100 p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        AI Analytics Dashboard
                    </h1>
                    <p className="text-gray-400">System performance and ticket insights</p>
                </div>
                <Link to="/dashboard" className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
                    Back to Dashboard
                </Link>
            </header>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                    <h3 className="text-gray-400 text-sm font-medium">Total Tickets</h3>
                    <p className="text-4xl font-bold mt-2">{stats?.total || 0}</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                    <h3 className="text-gray-400 text-sm font-medium">Pending (TODO)</h3>
                    <p className="text-4xl font-bold mt-2 text-yellow-500">{stats?.status?.TODO || 0}</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                    <h3 className="text-gray-400 text-sm font-medium">In Progress</h3>
                    <p className="text-4xl font-bold mt-2 text-blue-500">{stats?.status?.IN_PROGRESS || 0}</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                    <h3 className="text-gray-400 text-sm font-medium">Resolved</h3>
                    <p className="text-4xl font-bold mt-2 text-green-500">{stats?.status?.DONE || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Priority Distribution */}
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-6">Priority Distribution</h3>
                    <div className="space-y-4">
                        {['high', 'medium', 'low'].map(p => {
                            const count = stats?.priority[p] || 0;
                            const total = stats?.total || 1; // avoid /0
                            const pct = Math.round((count / total) * 100);
                            const color = p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-green-500';

                            return (
                                <div key={p}>
                                    <div className="flex justify-between mb-1">
                                        <span className="capitalize font-medium">{p}</span>
                                        <span className="text-gray-400">{count} ({pct}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                                        <div className={`${color} h-2.5 rounded-full`} style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Skills Required */}
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-6">Top AI-Detected Skills</h3>
                    <div className="space-y-3">
                        {stats?.skills?.map((skill, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                                <span className="font-mono text-blue-400">{skill._id || 'Uncategorized'}</span>
                                <span className="font-bold">{skill.count} tickets</span>
                            </div>
                        ))}
                        {stats?.skills?.length === 0 && <p className="text-gray-500">No skill data yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
