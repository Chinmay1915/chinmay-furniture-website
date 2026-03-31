import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setAuthData } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      const res = await api.post("/auth/login", { email, password });
      setAuthData(res.data.token, res.data.user);
      if (res.data.user?.is_admin) {
        navigate("/admin-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      let message = "Login failed. Check email/password.";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail[0]?.msg || message;
      }
      setError(message);
    }
  };

  return (
    <div className="container-page py-8">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>
      <form onSubmit={handleLogin} className="max-w-md space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn" type="submit">
          Login
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
      <p className="mt-4 text-sm">
        New user? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  );
}
