import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_top_left,_#f8fafc,_#e0f2fe_45%,_#fef3c7)] py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-white p-6 sm:p-7">
          <h2 className="text-3xl font-semibold">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const completeAuth = (data) => {
    setAuthData(data.token, data.user);
    if (data.user?.is_admin) navigate("/admin-dashboard");
    else navigate("/");
  };

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setError("");
      setLoading(true);
      try {
        const res = await api.post("/auth/google", { credential });
        completeAuth(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Google signup failed.");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setOtpInfo("");
    if (name.trim().length < 2) return setError("Name must be at least 2 characters.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (!otp.trim() || otp.trim().length !== 6) return setError("Enter the 6-digit OTP.");

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", { name, email, password, otp: otp.trim() });
      completeAuth(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Signup failed. Try another email.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    setOtpInfo("");
    if (!email.includes("@")) return setError("Enter a valid email address first.");
    setSendingOtp(true);
    try {
      await api.post("/auth/request-otp", { email, purpose: "signup" });
      setOtpInfo("OTP sent to your email. It is valid for 10 minutes.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <AuthShell title="Create Account" subtitle="Join BR Furniture in under a minute">
      <div className="space-y-4">
        <GoogleAuthButton onCredential={handleGoogleCredential} disabled={loading} />
        <div className="relative text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400 bg-white px-3">or</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-slate-200" />
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <input className="w-full border border-slate-300 p-3 rounded-xl" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="w-full border border-slate-300 p-3 rounded-xl" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full border border-slate-300 p-3 rounded-xl" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input className="w-full border border-slate-300 p-3 rounded-xl" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
            <button
              type="button"
              className="rounded-xl px-4 text-sm border border-slate-300 hover:border-slate-400 disabled:opacity-60"
              onClick={handleSendOtp}
              disabled={loading || sendingOtp}
            >
              {sendingOtp ? "Sending..." : "Send OTP"}
            </button>
          </div>
          <button className="w-full rounded-xl py-3 text-white font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-95 disabled:opacity-60" type="submit" disabled={loading || sendingOtp}>
            {loading ? "Please wait..." : "Create Account"}
          </button>
          {otpInfo && <p className="text-emerald-700 text-sm">{otpInfo}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>

        <p className="text-sm text-slate-600 text-center">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-slate-900 underline">
            Login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
