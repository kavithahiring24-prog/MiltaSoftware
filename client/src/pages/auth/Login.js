import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const buildLoginError = (err) => {
    if (err?.response?.status !== 429) {
      return err.response?.data?.message || "Login failed";
    }

    const retryAfter = Number(err.response?.headers?.["retry-after"]);
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      const minutes = Math.ceil(retryAfter / 60);
      return `Too many login attempts. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`;
    }

    return err.response?.data?.message || "Too many login attempts. Please try again later.";
  };

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = form.identifier.includes("@")
        ? { email: form.identifier, password: form.password }
        : { username: form.identifier, password: form.password };
      await loginUser(payload);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(buildLoginError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <h1>Welcome Back</h1>
        <p>Login to access your dashboard.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="identifier">Email or Username</label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            value={form.identifier}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-link">No account? Contact Admin to create your login.</p>
        <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            style={{ background: "none", border: "none", color: "#666", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}
          >
            Forgot Password?
          </button>
        </p>
      </section>
    </main>
  );
}

export default Login;
