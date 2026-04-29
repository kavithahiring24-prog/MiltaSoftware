import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import ModulesTiles from "../../components/ModulesTiles";
import { useAuth } from "../../context/AuthContext";
import {
  getManagerTasks,
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

function ManagerDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [tasks, setTasks]           = useState([]);
  const [projects, setProjects]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    Promise.all([getManagerTasks(), getProjects()])
      .then(([t, p]) => { setTasks(t || []); setProjects(p || []); })
      .catch((e) => setError(e.response?.data?.message || "Failed to load"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => { logoutUser(); navigate("/login", { replace: true }); };

  if (isLoading) return (
    <WorkspaceLayout role="Manager" title="Manager Dashboard" onLogout={handleLogout}>
      <div style={{ padding: 32, color: "#64748b" }}>Loading manager dashboard...</div>
    </WorkspaceLayout>
  );

  const open       = tasks.filter((t) => t.status === "Open").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const completed  = tasks.filter((t) => t.status === "Completed").length;
  const overdue    = tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) < today && t.status !== "Completed").length;
  const dueToday   = tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) === today && t.status !== "Completed");
  const overdueList = tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) < today && t.status !== "Completed");
  const TILE_COLORS = ["#0b66e4","#6366f1","#10b981","#f59e0b","#ec4899","#06b6d4"];

  return (
    <WorkspaceLayout
      role="Manager"
      title="Manager Dashboard"
      subtitle={`${user?.name || "Manager"}`}
      onLogout={handleLogout}
      activeSection="Home"
    >
      {error && <p className="error-text">{error}</p>}

      <div className="admin-hero" style={{ marginBottom: 14 }}>
        <div className="admin-hero-main">
          <h2>Good {greeting()}, {user?.name?.split(" ")[0]}</h2>
          <p>Manager · Team task overview</p>
        </div>
        <div className="admin-hero-meta">
          {overdue > 0 && <span className="status-pill">{overdue} Overdue</span>}
          <span className="status-pill subtle">{inProgress} In Progress</span>
        </div>
      </div>

      <section className="stat-grid premium-stats" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
        {[
          { label: "Total Tasks",   value: tasks.length, accent: "#0b66e4" },
          { label: "Open",          value: open,          accent: "#10b981" },
          { label: "In Progress",   value: inProgress,    accent: "#6366f1" },
          { label: "Completed",     value: completed,     accent: "#64748b" },
          { label: "Overdue",       value: overdue,       accent: "#ef4444" },
          { label: "My Projects",   value: projects.length, accent: "#f59e0b" },
        ].map((k) => (
          <article className="stat-card" key={k.label} style={{ borderTop: `3px solid ${k.accent}` }}>
            <h3>{k.label}</h3>
            <p style={{ color: k.accent }}>{k.value}</p>
          </article>
        ))}
      </section>

      <ModulesTiles role="Manager" stats={{}} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 4 }}>
        <article className="panel-card">
          <div className="panel-head">
            <h2>Due Today</h2>
            <span className="badge">{dueToday.length}</span>
          </div>
          <div className="list-wrap">
            {dueToday.slice(0, 6).map((t) => (
              <div className="list-item polished-item" key={t.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusDot status={t.status} />
                  <span>
                    <strong style={{ fontSize: 13 }}>{t.task_id || "Task"}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: "#64748b" }}>{t.description}</span>
                  </span>
                </div>
                <span className={`status-chip ${(t.status||"open").toLowerCase().replace(/\s+/g,"-")}`} style={{ fontSize: 10 }}>{t.status}</span>
              </div>
            ))}
            {dueToday.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Nothing due today</p>}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Overdue Tasks</h2>
            <button type="button" className="secondary-btn" style={{ fontSize: 12, margin: 0 }} onClick={() => navigate("/manager/tasks")}>View Board</button>
          </div>
          <div className="list-wrap">
            {overdueList.slice(0, 6).map((t) => (
              <div className="list-item polished-item" key={t.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusDot status="Overdue" />
                  <span>
                    <strong style={{ fontSize: 13 }}>{t.task_id || "Task"}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: "#64748b" }}>{t.description}</span>
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{fmt(t.due_date)}</span>
              </div>
            ))}
            {overdueList.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No overdue tasks</p>}
          </div>
        </article>

        <article className="panel-card" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-head">
            <h2>My Projects</h2>
            <button type="button" className="secondary-btn" style={{ fontSize: 12, margin: 0 }} onClick={() => navigate("/projects")}>View All</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10, marginTop: 4 }}>
            {projects.slice(0, 6).map((p, i) => (
              <div key={p.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: 4, background: TILE_COLORS[i % TILE_COLORS.length] }} />
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{p.project_title}</span>
                    <span className={`status-chip ${(p.status||"active").toLowerCase().replace(/\s+/g,"-")}`} style={{ fontSize: 10 }}>{p.status||"Active"}</span>
                  </div>
                  <div style={{ marginTop: 8, background: "#e2e8f0", borderRadius: 999, height: 4 }}>
                    <div style={{ width: `${p.progress || 0}%`, height: 4, borderRadius: 999, background: TILE_COLORS[i % TILE_COLORS.length] }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>{p.progress || 0}% complete</span>
                </div>
              </div>
            ))}
            {projects.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No projects assigned</p>}
          </div>
        </article>
      </div>
    </WorkspaceLayout>
  );
}

export default ManagerDashboard;
