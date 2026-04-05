import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_top_left,_#f8fafc,_#dbeafe_45%,_#fde68a)] py-10 px-4">
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loginMode, setLoginMode] = useState("password"); // password | otp
  const [error, setError] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [sendingResetOtp, setSendingResetOtp] = useState(false);
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
        setError(err.response?.data?.detail || "Google login failed.");
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setOtpInfo("");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (!otp.trim() || otp.trim().length !== 6) return setError("Enter the 6-digit OTP.");
    if (loginMode === "password" && password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const res =
        loginMode === "password"
          ? await api.post("/auth/login", { email, password, otp: otp.trim() })
          : await api.post("/auth/login-otp", { email, otp: otp.trim() });
      completeAuth(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Login failed. Check email/password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    setOtpInfo("");
    if (!email.includes("@")) return setError("Enter a valid email address first.");
    if (loginMode === "password" && password.length < 6) {
      return setError("Enter password first to send login OTP.");
    }

    setSendingOtp(true);
    try {
      const payload =
        loginMode === "password"
          ? { email, password, purpose: "login" }
          : { email, purpose: "login" };
      await api.post("/auth/request-otp", payload);
      setOtpInfo("OTP sent to your registered email. It is valid for 10 minutes.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSendResetOtp = async () => {
    setError("");
    setResetInfo("");
    if (!email.includes("@")) return setError("Enter your registered email first.");
    setSendingResetOtp(true);
    try {
      await api.post("/auth/request-otp", { email, purpose: "reset" });
      setResetInfo("Reset OTP sent to your email. It is valid for 10 minutes.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not send reset OTP.");
    } finally {
      setSendingResetOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setResetInfo("");
    if (!email.includes("@")) return setError("Enter your registered email first.");
    if (!resetOtp.trim() || resetOtp.trim().length !== 6) return setError("Enter the 6-digit reset OTP.");
    if (newPassword.length < 6) return setError("New password must be at least 6 characters.");
    if (newPassword !== confirmNewPassword) return setError("New password and confirm password do not match.");

    setResetLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", {
        email,
        otp: resetOtp.trim(),
        new_password: newPassword,
      });
      setResetInfo("Password reset successful. You can now login with new password.");
      setShowForgot(false);
      setPassword("");
      setOtp("");
      setResetOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Password reset failed.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome Back" subtitle="Login to continue your shopping">
      <div className="space-y-4">
        <GoogleAuthButton onCredential={handleGoogleCredential} disabled={loading} />
        <div className="relative text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400 bg-white px-3">or</span>
          <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-slate-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              className={`rounded-lg py-2 text-sm ${loginMode === "password" ? "bg-white shadow-sm" : "text-slate-600"}`}
              onClick={() => setLoginMode("password")}
            >
              Password + OTP
            </button>
            <button
              type="button"
              className={`rounded-lg py-2 text-sm ${loginMode === "otp" ? "bg-white shadow-sm" : "text-slate-600"}`}
              onClick={() => setLoginMode("otp")}
            >
              Google Email OTP
            </button>
          </div>
          <input className="w-full border border-slate-300 p-3 rounded-xl" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {loginMode === "password" && (
            <input className="w-full border border-slate-300 p-3 rounded-xl" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          )}
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
            {loading ? "Please wait..." : "Login"}
          </button>
          {otpInfo && <p className="text-emerald-700 text-sm">{otpInfo}</p>}
          {resetInfo && <p className="text-emerald-700 text-sm">{resetInfo}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>

        <button
          type="button"
          className="text-sm text-slate-700 underline w-full text-left"
          onClick={() => {
            setShowForgot((v) => !v);
            setError("");
            setResetInfo("");
          }}
        >
          {showForgot ? "Hide forgot password" : "Forgot password?"}
        </button>

        {showForgot && (
          <form onSubmit={handleResetPassword} className="space-y-3 rounded-xl border border-slate-200 p-3">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                className="w-full border border-slate-300 p-3 rounded-xl"
                placeholder="Enter 6-digit reset OTP"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value)}
                maxLength={6}
                required
              />
              <button
                type="button"
                className="rounded-xl px-4 text-sm border border-slate-300 hover:border-slate-400 disabled:opacity-60"
                onClick={handleSendResetOtp}
                disabled={sendingResetOtp || resetLoading}
              >
                {sendingResetOtp ? "Sending..." : "Send OTP"}
              </button>
            </div>
            <input
              className="w-full border border-slate-300 p-3 rounded-xl"
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              className="w-full border border-slate-300 p-3 rounded-xl"
              type="password"
              placeholder="Confirm new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
            <button
              className="w-full rounded-xl py-3 text-white font-semibold bg-gradient-to-r from-slate-700 to-slate-900 hover:opacity-95 disabled:opacity-60"
              type="submit"
              disabled={resetLoading || sendingResetOtp}
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-sm text-slate-600 text-center">
          New user?{" "}
          <Link to="/signup" className="font-semibold text-slate-900 underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
