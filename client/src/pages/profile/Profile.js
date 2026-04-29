import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import { useAuth } from "../../context/AuthContext";
import { changePassword, updateProfile } from "../../services/auth";

function Profile() {
  const navigate = useNavigate();
  const { user, logoutUser, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handleLogout = () => { logoutUser(); navigate("/login", { replace: true }); };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError(""); setProfileSuccess("");
    if (!profileForm.name.trim()) return setProfileError("Name is required");
    if (!profileForm.email.trim()) return setProfileError("Email is required");
    setProfileSaving(true);
    try {
      await updateProfile({ name: profileForm.name.trim(), email: profileForm.email.trim() });
      await refreshUser();
      setProfileSuccess("Profile updated successfully.");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (!pwForm.currentPassword) return setPwError("Current password is required");
    if (!pwForm.newPassword) return setPwError("New password is required");
    if (pwForm.newPassword.length < 6) return setPwError("New password must be at least 6 characters");
    if (pwForm.newPassword !== pwForm.confirmPassword) return setPwError("New passwords do not match");
    if (pwForm.currentPassword === pwForm.newPassword) return setPwError("New password must differ from current password");
    setPwSaving(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwSuccess("Password changed successfully. Use your new password next time you log in.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const roleColor = {
    Admin: "#0b66e4", Manager: "#6366f1", Employee: "#10b981", Client: "#f59e0b",
  };
  const accent = roleColor[user?.role] || "#64748b";
  const initials = (user?.name || user?.username || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <WorkspaceLayout
      role={user?.role || "Employee"}
      title="My Profile"
      subtitle={`${user?.name} · ${user?.role}`}
      onLogout={handleLogout}
      activeSection="Profile"
    >
      {/* Avatar hero */}
      <div className="admin-hero" style={{ marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: accent, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{user?.name}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
              @{user?.username}&nbsp;·&nbsp;
              <span style={{ fontWeight: 700, color: accent }}>{user?.role}</span>
            </p>
          </div>
        </div>
        <div className="admin-hero-meta">
          <span className="status-pill subtle">{user?.email}</span>
        </div>
      </div>

      {/* Tabs */}
      <section className="project-tabs" style={{ marginBottom: 16 }}>
        {[
          { key: "profile", label: "Edit Profile" },
          { key: "password", label: "Change Password" },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </section>

      {/* Edit Profile tab */}
      {activeTab === "profile" && (
        <article className="panel-card" style={{ maxWidth: 520 }}>
          <div className="panel-head"><h2>Profile Details</h2></div>
          {profileError && <p className="error-text">{profileError}</p>}
          {profileSuccess && <p className="success-text">{profileSuccess}</p>}
          <form className="project-form premium-project-form" onSubmit={handleProfileSave}>
            <div className="project-form-row full">
              <label>Full Name</label>
              <input
                value={profileForm.name}
                onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="project-form-row full">
              <label>Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="project-form-row full">
              <label>Username</label>
              <input value={user?.username || ""} disabled style={{ background: "#f8fafc", color: "#94a3b8" }} />
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                Username cannot be changed. Contact Admin if needed.
              </span>
            </div>
            <div className="project-form-row full">
              <label>Role</label>
              <input value={user?.role || ""} disabled style={{ background: "#f8fafc", color: "#94a3b8" }} />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </article>
      )}

      {/* Change Password tab */}
      {activeTab === "password" && (
        <article className="panel-card" style={{ maxWidth: 520 }}>
          <div className="panel-head"><h2>Change Password</h2></div>
          {pwError && <p className="error-text">{pwError}</p>}
          {pwSuccess && <p className="success-text">{pwSuccess}</p>}
          <form className="project-form premium-project-form" onSubmit={handlePasswordChange}>
            <div className="project-form-row full">
              <label>Current Password</label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter your current password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="project-form-row full">
              <label>New Password</label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="project-form-row full">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Re-enter new password"
                autoComplete="new-password"
                required
              />
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 4 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}>
                After changing your password, use the new password on your next login.
              </p>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={pwSaving}>
                {pwSaving ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>
        </article>
      )}
    </WorkspaceLayout>
  );
}

export default Profile;
