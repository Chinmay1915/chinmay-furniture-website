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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [otpInfo, setOtpInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const normalizedEmail = email.trim().toLowerCase();
  const isGmail = /^[a-z0-9._%+-]+@gmail\.com$/.test(normalizedEmail);
  const isNameValid = name.trim().length >= 2 && name.trim().length <= 20 && /^[A-Za-z ]+$/.test(name.trim());
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = confirmPassword.length > 0 && confirmPassword === password;

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

  const handleEmailBlur = async () => {
    setEmailTouched(true);
    if (!normalizedEmail || !isGmail) return;
    setCheckingEmail(true);
    setEmailError("");
    setEmailExists(false);
    try {
      const res = await api.post("/auth/check-email", { email: normalizedEmail, purpose: "signup" });
      if (res.data?.exists) {
        setEmailExists(true);
        setEmailError("Email already registered.");
      }
    } catch (err) {
      // Ignore check failures; signup flow will show errors on submit
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setOtpInfo("");
    if (!name.trim()) return setError("Please fill the name before proceeding.");
    if (!isNameValid) return setError("Name must be 2-20 letters only (no numbers).");
    if (!isGmail) return setError("Enter a valid Gmail address.");
    if (emailExists) return setEmailError("Email already registered.");
    if (!isPasswordValid) return setError("Password must be at least 6 characters.");
    if (!isConfirmValid) return setError("Re-enter the password correctly.");
    if (!otp.trim() || otp.trim().length !== 6 || !/^[0-9]{6}$/.test(otp.trim())) {
      return setError("Enter the valid 6-digit OTP.");
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", { name, email: normalizedEmail, password, otp: otp.trim() });
      completeAuth(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === "Email already registered") {
        setEmailError("Email already registered.");
      } else {
        setError(typeof detail === "string" ? detail : "Signup failed. Try another email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    setEmailError("");
    setOtpInfo("");
    if (!isGmail) return setError("Enter a valid Gmail address first.");
    if (emailExists) return setEmailError("Email already registered.");
    setSendingOtp(true);
    try {
      const res = await api.post("/auth/request-otp", { email: normalizedEmail, purpose: "signup" });
      if (res.data?.message) setOtpInfo(res.data.message);
      else setOtpInfo("OTP sent to your email. It is valid for 10 minutes.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === "Email already registered") {
        setEmailError("Email already registered.");
      } else {
        setError(typeof detail === "string" ? detail : "Could not send OTP.");
      }
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
          <input
            className="w-full border border-slate-300 p-3 rounded-xl"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^A-Za-z ]/g, ""))}
            onBlur={() => setNameTouched(true)}
            maxLength={20}
            required
          />
          {nameTouched && !name.trim() && <p className="text-xs text-red-600">Please fill this section before continuing.</p>}
          {nameTouched && name.trim() && !/^[A-Za-z ]+$/.test(name.trim()) && (
            <p className="text-xs text-red-600">Name cannot contain numbers.</p>
          )}
          <input
            className="w-full border border-slate-300 p-3 rounded-xl"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
              setEmailExists(false);
            }}
            onBlur={handleEmailBlur}
            disabled={!name.trim()}
            required
          />
          {emailTouched && email.trim() && !isGmail && (
            <p className="text-xs text-red-600">Use a valid Gmail address (example@gmail.com).</p>
          )}
          {emailTouched && !email.trim() && (
            <p className="text-xs text-red-600">Please fill this section before continuing.</p>
          )}
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
          {checkingEmail && <p className="text-xs text-slate-500">Checking email...</p>}
          <div className="relative">
            <input
              className="w-full border border-slate-300 p-3 rounded-xl pr-12"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              disabled={!name.trim() || !isGmail || emailExists}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <input
              className="w-full border border-slate-300 p-3 rounded-xl pr-12"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmTouched(true)}
              disabled={!isPasswordValid || emailExists}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
          {confirmTouched && confirmPassword && confirmPassword !== password && (
            <p className="text-xs text-red-600">Re-enter the password correctly.</p>
          )}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              className="w-full border border-slate-300 p-3 rounded-xl"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              disabled={!isConfirmValid || emailExists}
              required
            />
            <button
              type="button"
              className="rounded-xl px-4 text-sm border border-slate-300 hover:border-slate-400 disabled:opacity-60"
              onClick={handleSendOtp}
              disabled={loading || sendingOtp || !isGmail || emailExists}
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
