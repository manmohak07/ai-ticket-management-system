import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", skills: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            skills: form.skills ? form.skills.split(",").map((s) => s.trim()) : [],
            role: form.role || "user",
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Smooth transition
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        setError(data.error || data.message || "Signup failed");
      }
    } catch (err) {
      setError("Unable to connect to server. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Signup Card */}
      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center gap-3 mb-2">
            <svg
              className="w-10 h-10 text-blue-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-2xl font-bold">TicketAI</span>
          </div>
          <p className="text-gray-400">Create your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl animate-slideUp">
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-300 group-hover:border-gray-700"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">
                Password
              </label>
              <div className="relative group">
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-300 group-hover:border-gray-700"
                  value={form.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            {/* Skills Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">
                Skills (Optional)
              </label>
              <div className="relative group">
                <input
                  type="text"
                  name="skills"
                  placeholder="React, Node.js, MongoDB"
                  className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-300 group-hover:border-gray-700"
                  value={form.skills}
                  onChange={handleChange}
                  disabled={loading}
                />
                <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
              <p className="text-xs text-gray-500">Separate skills with commas</p>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "user" })}
                  className={`p-4 rounded-xl border transition-all duration-300 ${form.role === "user"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-800 hover:border-gray-700"
                    }`}
                  disabled={loading}
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1">User</div>
                    <div className="text-xs text-gray-500">
                      Submit and track tickets
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "moderator" })}
                  className={`p-4 rounded-xl border transition-all duration-300 ${form.role === "moderator"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-800 hover:border-gray-700"
                    }`}
                  disabled={loading}
                >
                  <div className="text-left">
                    <div className="font-semibold mb-1">Moderator</div>
                    <div className="text-xs text-gray-500">
                      Resolve support tickets
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-shake">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-6"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
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
                  <span>Creating account...</span>
                </div>
              ) : (
                <>
                  <span>Create Account</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900/50 text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="block w-full py-3 rounded-xl border border-gray-800 hover:bg-gray-800/50 transition-all duration-300 font-semibold text-center group"
          >
            <span>Sign in instead</span>
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-out;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
