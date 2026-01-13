import { Link } from "react-router-dom";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-gray-100">
            {/* Navigation Bar */}
            <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl fixed w-full top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <svg
                            className="w-8 h-8 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        <span className="text-xl font-bold">AI Ticket Management System (AITMS)</span>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/login"
                            className="px-5 py-2 rounded-full hover:bg-gray-900 transition-colors font-medium"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/signup"
                            className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors font-medium text-white"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-3xl">
                        <h1 className="text-7xl font-bold mb-6 leading-tight">
                            Support tickets,{" "}
                            <span className="text-blue-500">intelligently routed</span>
                        </h1>
                        <p className="text-2xl text-gray-400 mb-10 leading-relaxed">
                            AI-powered ticket management that automatically categorizes,
                            prioritizes, and assigns support requests to the right team
                            members.
                        </p>
                        <div className="flex gap-4">
                            <Link
                                to="/signup"
                                className="px-8 py-4 rounded-full bg-blue-500 hover:bg-blue-600 transition-all font-semibold text-lg hover:scale-105 transform"
                            >
                                Get started
                            </Link>
                            <Link
                                to="/login"
                                className="px-8 py-4 rounded-full border border-gray-700 hover:bg-gray-900 transition-colors font-semibold text-lg"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                                <svg
                                    className="w-6 h-6 text-blue-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">AI-Powered Analysis</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Automatically categorize and prioritize tickets using advanced
                                language models
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                                <svg
                                    className="w-6 h-6 text-green-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Smart Assignment</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Match tickets with the most qualified team members based on
                                skills and expertise
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                                <svg
                                    className="w-6 h-6 text-purple-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Instant Notifications</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Real-time email alerts keep your team informed about new
                                assignments
                            </p>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="mt-32 grid grid-cols-3 gap-8 border-t border-b border-gray-800 py-12">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-blue-500 mb-2">95%</div>
                            <div className="text-gray-400">Faster routing</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-green-500 mb-2">50%</div>
                            <div className="text-gray-400">Reduced response time</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-purple-500 mb-2">
                                100%
                            </div>
                            <div className="text-gray-400">Automated triage</div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 py-8 mt-20">
                <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
                    <p>&copy; 2025 TicketAI. Built with AI-powered intelligence.</p>
                </div>
            </footer>
        </div>
    );
}
