import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/auth";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetToken("");
    setIsLoading(true);
    try {
      const data = await forgotPassword(email);
      setResetToken(data.reset_token);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <h1>Reset Password</h1>
        <p style={{ color: "#888", marginBottom: "1.5rem" }}>
          Enter your account email to generate a reset token.
        </p>

        {error ? <p className="error-text">{error}</p> : null}

        {resetToken ? (
          <div>
            <p className="success-text">Reset token generated successfully.</p>
            <div
              style={{
                background: "#f5f5f5",
                border: "1px solid #ddd",
                borderRadius: "6px",
                padding: "1rem",
                marginBottom: "1rem",
                wordBreak: "break-all",
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
            >
              {resetToken}
            </div>
            <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Copy this token and use it on the reset password page. It expires in 1 hour.
            </p>
            <div className="action-row">
              <button type="button" onClick={() => navigate("/reset-password")}>
                Go to Reset Password
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigator.clipboard?.writeText(resetToken)}
              >
                Copy Token
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>
            <button type="submit" disabled={isLoading} style={{ width: "100%", marginTop: "0.5rem" }}>
              {isLoading ? "Processing..." : "Generate Reset Token"}
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

export default ForgotPassword;
