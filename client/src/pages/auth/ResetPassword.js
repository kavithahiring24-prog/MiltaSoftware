import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/auth";

function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (newPassword !== confirm) {
      return setError("Passwords do not match");
    }

    setIsLoading(true);
    try {
      const data = await resetPassword(token.trim(), newPassword);
      setSuccess(data.message || "Password reset successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <h1>Set New Password</h1>
        <p style={{ color: "#888", marginBottom: "1.5rem" }}>
          Paste your reset token and choose a new password.
        </p>

        {error ? <p className="error-text">{error}</p> : null}

        {success ? (
          <div>
            <p className="success-text">{success}</p>
            <button type="button" onClick={() => navigate("/login")} style={{ marginTop: "1rem", width: "100%" }}>
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="token">Reset Token</label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token here"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>
            <button type="submit" disabled={isLoading} style={{ width: "100%", marginTop: "0.5rem" }}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <button
            type="button"
            className="secondary-btn"
            style={{ background: "none", border: "none", color: "#666", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </p>
      </section>
    </main>
  );
}

export default ResetPassword;
