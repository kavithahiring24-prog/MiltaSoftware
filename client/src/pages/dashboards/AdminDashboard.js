import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import ModulesTiles from "../../components/ModulesTiles";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminStats,
  getPendingTimesheets,
  getProjects,
} from "../../services/auth";

const today = new Date().toISOString().slice(0, 10);

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function StatusDot({ status }) {
  const colors = {
    "Open":        "#10b981",
    "In Progress": "#0b66e4",
    "Completed":   "#64748b",
    "Overdue":     "#ef4444",
    "Pending":     "#f59e0b",
    "Approved":    "#10b981",
  };
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: colors[status] || "#94a3b8", marginRight: 6, flexShrink: 0,
    }} />
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [stats, setStats]           = useState(null);
  const [pending, setPending]       = useState([]);
  const [projects, setProjects]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    Promise.all([getAdminStats(), getPendingTimesheets(), getProjects()])
      .then(([s, p, pr]) => { setStats(s); setPending(p || []); setProjects(pr || []); })
      .catch((e) => setError(e.response?.data?.message || "Failed to load"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => { logoutUser(); navigate("/login", { replace: true }); };

  if (isLoading) return (
    <WorkspaceLayout role="Admin" title="Admin Dashboard" onLogout={handleLogout}>
      <div style={{ padding: 32, color: "#64748b" }}>Loading admin dashboard...</div>
    </WorkspaceLayout>
  );

  const activeProjects  = projects.filter((p) => p.status !== "Completed").length;
  const pendingApprovals = pending.filter((p) => p.approval_status === "Pending").length;
  const TILE_COLORS = ["#0b66e4","#6366f1","#10b981","#f59e0b","#ec4899","#06b6d4"];

  return (
    <WorkspaceLayout
      role="Admin"
      title="Admin Dashboard"
      subtitle={`${user?.name || "Administrator"}`}
      onLogout={handleLogout}
      activeSection="Home"
    >
      {error && <p className="error-text">{error}</p>}

      <div className="admin-hero" style={{ marginBottom: 14 }}>
        <div className="admin-hero-main">
          <h2>Good {greeting()}, {user?.name?.split(" ")[0]}</h2>
          <p>Admin · Full system overview</p>
        </div>
        <div className="admin-hero-meta">
          <span className="status-pill">{pendingApprovals} Pending Approvals</span>
          <span className="status-pill subtle">{activeProjects} Active Projects</span>
        </div>
      </div>

      <section className="stat-grid premium-stats" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
        {[
          { label: "Total Users",     value: stats?.users      || 0, accent: "#0b66e4" },
          { label: "Total Clients",   value: stats?.clients    || 0, accent: "#6366f1" },
          { label: "Categories",      value: stats?.categories || 0, accent: "#10b981" },
          { label: "Active Projects", value: activeProjects,          accent: "#f59e0b" },
          { label: "Pending Approvals", value: pendingApprovals,      accent: "#ef4444" },
          { label: "Total Projects",  value: projects.length,         accent: "#8b5cf6" },
        ].map((k) => (
          <article className="stat-card" key={k.label} style={{ borderTop: `3px solid ${k.accent}` }}>
            <h3>{k.label}</h3>
            <p style={{ color: k.accent }}>{k.value}</p>
          </article>
        ))}
      </section>

      <ModulesTiles role="Admin" stats={{}} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 4 }}>
        <article className="panel-card">
          <div className="panel-head">
            <h2>Pending Approvals</h2>
            <button type="button" className="secondary-btn" style={{ fontSize: 12, margin: 0 }} onClick={() => navigate("/admin/time-logs")}>View All</button>
          </div>
          <div className="list-wrap">
            {pending.filter((p) => p.approval_status === "Pending").slice(0, 6).map((p) => (
              <div className="list-item polished-item" key={p.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusDot status="Pending" />
                  <span>
                    <strong style={{ fontSize: 13 }}>{p.Task?.task_id || "—"}</strong>
                    <span style={{ color: "#64748b", fontSize: 12 }}> · {p.Employee?.name || "Employee"}</span>
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>{p.hours_spent}h</span>
              </div>
            ))}
            {pending.filter((p) => p.approval_status === "Pending").length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No pending approvals</p>
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Recent Projects</h2>
            <button type="button" className="secondary-btn" style={{ fontSize: 12, margin: 0 }} onClick={() => navigate("/projects")}>View All</button>
          </div>
          <div className="list-wrap">
            {projects.slice(0, 6).map((p, i) => (
              <div className="list-item polished-item" key={p.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: TILE_COLORS[i % TILE_COLORS.length], flexShrink: 0 }} />
                  <span>
                    <strong style={{ fontSize: 13, color: "#1e293b" }}>{p.project_title}</strong>
                    <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>{p.project_code}</span>
                  </span>
                </div>
                <span className={`status-chip ${(p.status || "active").toLowerCase().replace(/\s+/g, "-")}`} style={{ fontSize: 10 }}>
                  {p.status || "Active"}
                </span>
              </div>
            ))}
            {projects.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No projects yet</p>}
          </div>
        </article>
      </div>
    </WorkspaceLayout>
  );
}

export default AdminDashboard;
