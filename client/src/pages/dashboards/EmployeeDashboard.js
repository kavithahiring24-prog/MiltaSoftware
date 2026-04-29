import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import ModulesTiles from "../../components/ModulesTiles";
import { useAuth } from "../../context/AuthContext";
import {
  getMyTasks,
  getMyTimesheets,
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

function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [tasks, setTasks]           = useState([]);
  const [logs, setLogs]             = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    Promise.all([getMyTasks(), getMyTimesheets()])
      .then(([t, l]) => { setTasks(t || []); setLogs(l || []); })
      .catch((e) => setError(e.response?.data?.message || "Failed to load"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => { logoutUser(); navigate("/login", { replace: true }); };

  if (isLoading) return (
    <WorkspaceLayout role="Employee" title="My Dashboard" onLogout={handleLogout}>
      <div style={{ padding: 32, color: "#64748b" }}>Loading your dashboard...</div>
    </WorkspaceLayout>
  );

  const open         = tasks.filter((t) => t.status === "Open").length;
  const inProgress   = tasks.filter((t) => t.status === "In Progress").length;
  const completed    = tasks.filter((t) => t.status === "Completed").length;
  const overdueList  = tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) < today && t.status !== "Completed");
  const dueTodayList = tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) === today && t.status !== "Completed");
  const activeTasks  = tasks.filter((t) => t.status !== "Completed").slice(0, 6);
  const hoursThisWeek = logs.filter((l) => {
    const d = new Date(l.createdAt);
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    return d >= weekStart;
  }).reduce((sum, l) => sum + (Number(l.hours_spent) || 0), 0);

  const TILE_COLORS = ["#0b66e4","#6366f1","#10b981","#f59e0b","#ec4899","#06b6d4"];

  return (
    <WorkspaceLayout
      role="Employee"
      title="My Dashboard"
      subtitle={`${user?.name || "Employee"}`}
      onLogout={handleLogout}
      activeSection="Home"
    >
      {error && <p className="error-text">{error}</p>}

      <div className="admin-hero" style={{ marginBottom: 14 }}>
        <div className="admin-hero-main">
          <h2>Good {greeting()}, {user?.name?.split(" ")[0]}</h2>
          <p>Employee · Your tasks and time logs</p>
        </div>
        <div className="admin-hero-meta">
          {overdueList.length > 0 && <span className="status-pill">{overdueList.length} Overdue</span>}
          <span className="status-pill subtle">{hoursThisWeek.toFixed(1)}h this week</span>
        </div>
      </div>

      <section className="stat-grid premium-stats" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
        {[
          { label: "Open Tasks",    value: open,                           accent: "#0b66e4" },
          { label: "In Progress",   value: inProgress,                     accent: "#6366f1" },
          { label: "Completed",     value: completed,                      accent: "#10b981" },
          { label: "Due Today",     value: dueTodayList.length,            accent: "#f59e0b" },
          { label: "Overdue",       value: overdueList.length,             accent: "#ef4444" },
          { label: "Hours (week)",  value: `${hoursThisWeek.toFixed(1)}h`, accent: "#8b5cf6" },
        ].map((k) => (
          <article className="stat-card" key={k.label} style={{ borderTop: `3px solid ${k.accent}` }}>
            <h3>{k.label}</h3>
            <p style={{ color: k.accent }}>{k.value}</p>
          </article>
        ))}
      </section>

      <ModulesTiles role="Employee" stats={{}} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 4 }}>
        <article className="panel-card">
          <div className="panel-head">
            <h2>My Active Tasks</h2>
            <button type="button" className="secondary-btn" style={{ fontSize: 12, margin: 0 }} onClick={() => navigate("/employee/tasks")}>View All</button>
          </div>
          <div className="list-wrap">
            {activeTasks.map((t, i) => (
              <div className="list-item polished-item" key={t.id}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ width: 3, borderRadius: 999, alignSelf: "stretch", background: TILE_COLORS[i % TILE_COLORS.length], flexShrink: 0 }} />
                  <span>
                    <strong style={{ fontSize: 13, color: "#1e293b" }}>{t.task_id || "Task"}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: "#64748b" }}>{t.description}</span>
                  </span>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className={`status-chip ${(t.status||"open").toLowerCase().replace(/\s+/g,"-")}`} style={{ fontSize: 10 }}>{t.status}</span>
                  {t.due_date && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{fmt(t.due_date)}</div>}
                </div>
              </div>
            ))}
            {activeTasks.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No active tasks</p>}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Due Today &amp; Overdue</h2>
            <span className="badge">{dueTodayList.length + overdueList.length}</span>
          </div>
          <div className="list-wrap">
            {dueTodayList.slice(0, 3).map((t) => (
              <div className="list-item polished-item" key={`td-${t.id}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusDot status="Pending" />
                  <span style={{ fontSize: 13 }}>{t.task_id} — {t.description?.slice(0, 40)}</span>
                </div>
                <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>Today</span>
              </div>
            ))}
            {overdueList.slice(0, 3).map((t) => (
              <div className="list-item polished-item" key={`od-${t.id}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusDot status="Overdue" />
                  <span style={{ fontSize: 13 }}>{t.task_id} — {t.description?.slice(0, 40)}</span>
                </div>
                <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{fmt(t.due_date)}</span>
              </div>
            ))}
            {dueTodayList.length + overdueList.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>You're all caught up!</p>
            )}
          </div>
        </article>

        <article className="panel-card" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-head">
            <h2>Recent Time Logs</h2>
            <button type="button" className="secondary-btn" style={{ fontSize: 12, margin: 0 }} onClick={() => navigate("/employee/tasks")}>Log Time</button>
          </div>
          <div className="list-wrap">
            {logs.slice(0, 6).map((l) => (
              <div className="list-item polished-item" key={l.id}>
                <div>
                  <strong style={{ fontSize: 13 }}>{l.Task?.task_id || "Timesheet"}</strong>
                  <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{l.Task?.description?.slice(0, 50)}</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{l.hours_spent}h</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: l.approval_status === "Approved" ? "#10b981" : l.approval_status === "Correction Requested" ? "#ef4444" : "#f59e0b" }}>
                    {l.approval_status || "Pending"}
                  </span>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No time logged yet</p>}
          </div>
        </article>
      </div>
    </WorkspaceLayout>
  );
}

export default EmployeeDashboard;
