import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import { clearAuth, createRole, getCurrentUser, getRoles } from "../../services/auth";

function Roles() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [roles, setRoles]     = useState([]);
  const [newRole, setNewRole] = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const SYSTEM_ROLES = ["Admin", "Manager", "Employee", "Client"];

  const loadData = async () => {
    const [currentUser, roleData] = await Promise.all([getCurrentUser(), getRoles()]);
    setUser(currentUser);
    setRoles(roleData || []);
  };

  useEffect(() => {
    const load = async () => {
      try { await loadData(); }
      catch (err) {
        setError(err.response?.data?.message || "Failed to load roles");
        if (err.response?.status === 401) { clearAuth(); navigate("/login", { replace: true }); }
      } finally { setIsLoading(false); }
    };
    load();
  }, [navigate]);

  const handleLogout = () => { clearAuth(); navigate("/login", { replace: true }); };

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newRole.trim();
    if (!trimmed) return;
    setError(""); setSuccess("");
    try {
      await createRole({ name: trimmed });
      setSuccess(`Role "${trimmed}" created.`);
      setNewRole("");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create role");
    }
  };

  const customRoles = roles.filter((r) => !SYSTEM_ROLES.includes(r.name));

  if (isLoading) {
    return <main className="auth-layout"><section className="auth-card"><h2>Loading roles...</h2></section></main>;
  }

  return (
    <WorkspaceLayout
      role={user?.role}
      title="Roles"
      subtitle={`Manage system roles · ${user?.name || ""}`}
      onLogout={handleLogout}
      activeSection="Roles"
    >
      <div className="admin-hero">
        <div className="admin-hero-main">
          <h2>Roles</h2>
          <p>{roles.length} role{roles.length !== 1 ? "s" : ""} · {SYSTEM_ROLES.length} system · {customRoles.length} custom</p>
        </div>
        <div className="admin-hero-meta">
          <span className="status-pill">{roles.length} Total</span>
        </div>
      </div>

      <section className="stat-grid premium-stats">
        <article className="stat-card"><h3>Total Roles</h3><p>{roles.length}</p></article>
        <article className="stat-card"><h3>System Roles</h3><p>{SYSTEM_ROLES.length}</p></article>
        <article className="stat-card"><h3>Custom Roles</h3><p>{customRoles.length}</p></article>
      </section>

      {error   && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      <section className="panel-card full-span" style={{ marginBottom: "14px" }}>
        <div className="panel-head"><h2>Add Custom Role</h2></div>
        <form className="project-form premium-project-form" onSubmit={handleCreate}>
          <div className="project-form-grid two-col">
            <div className="project-form-row">
              <label>Role Name *</label>
              <input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="e.g. Auditor, Viewer, Consultant"
                required
                minLength={2}
                autoFocus
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Create Role</button>
            <button type="button" className="secondary-btn" onClick={() => setNewRole("")}>Clear</button>
          </div>
        </form>
      </section>

      <section className="panel-card full-span">
        <div className="panel-head"><h2>All Roles</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td><strong style={{ color: "#19314b" }}>{r.name}</strong></td>
                  <td>
                    <span className={`status-chip ${SYSTEM_ROLES.includes(r.name) ? "active" : ""}`}>
                      {SYSTEM_ROLES.includes(r.name) ? "System" : "Custom"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {roles.length === 0 && (
            <div style={{ padding: "32px 24px", textAlign: "center", color: "#7a93b4" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "#3d5678" }}>No roles found</p>
            </div>
          )}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

export default Roles;
