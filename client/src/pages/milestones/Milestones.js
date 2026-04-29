import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  createMilestone,
  deleteMilestone,
  getCurrentUser,
  getMilestones,
  getProjects,
  updateMilestone,
} from "../../services/auth";

const STATUSES  = ["Not Started", "In Progress", "Completed", "Overdue"];
const STATUS_CHIP = {
  "Not Started": "completed",
  "In Progress": "in-progress",
  Completed:     "active",
  Overdue:       "",
};

const EMPTY_FORM = { title: "", description: "", dueDate: "", status: "Not Started", projectId: "" };

function Milestones() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects]   = useState([]);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [filterProject, setFilterProject] = useState("All");
  const [filterStatus,  setFilterStatus]  = useState("All");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isAdminOrManager = ["Admin", "Manager"].includes(user?.role);

  const loadData = async () => {
    const [currentUser, msData, projData] = await Promise.all([
      getCurrentUser(),
      getMilestones(),
      getProjects().catch(() => []),
    ]);
    setUser(currentUser);
    setMilestones(msData || []);
    setProjects(projData || []);
  };

  useEffect(() => {
    const load = async () => {
      try { await loadData(); }
      catch (err) {
        setError(err.response?.data?.message || "Failed to load milestones");
        if (err.response?.status === 401) { clearAuth(); navigate("/login", { replace: true }); }
      } finally { setIsLoading(false); }
    };
    load();
  }, [navigate]);

  const handleLogout = () => { clearAuth(); navigate("/login", { replace: true }); };
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const payload = { ...form, projectId: form.projectId || null };
      if (editingId) {
        await updateMilestone(editingId, payload);
        setSuccess("Milestone updated.");
      } else {
        await createMilestone(payload);
        setSuccess("Milestone created.");
      }
      setForm(EMPTY_FORM); setEditingId(null); setShowForm(false);
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to save milestone"); }
  };

  const handleEdit = (ms) => {
    setForm({
      title:       ms.title || "",
      description: ms.description || "",
      dueDate:     ms.dueDate || "",
      status:      ms.status || "Not Started",
      projectId:   ms.projectId || "",
    });
    setEditingId(ms.id); setShowForm(true); setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this milestone?")) return;
    setError(""); setSuccess("");
    try { await deleteMilestone(id); setSuccess("Milestone deleted."); await loadData(); }
    catch (err) { setError(err.response?.data?.message || "Failed to delete"); }
  };

  const filtered = milestones.filter((m) => {
    if (filterProject !== "All" && String(m.projectId) !== filterProject) return false;
    if (filterStatus  !== "All" && m.status !== filterStatus)              return false;
    return true;
  });

  const countBy = (key, val) => milestones.filter((m) => m[key] === val).length;

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  };

  if (isLoading) {
    return <main className="auth-layout"><section className="auth-card"><h2>Loading milestones...</h2></section></main>;
  }

  return (
    <WorkspaceLayout
      role={user?.role}
      title="Milestones"
      subtitle={`Track key project checkpoints · ${user?.name || ""}`}
      onLogout={handleLogout}
      activeSection="Milestones"
    >
      {/* Hero */}
      <div className="admin-hero">
        <div className="admin-hero-main">
          <h2>Milestones</h2>
          <p>
            {milestones.length} total &nbsp;·&nbsp;
            {countBy("status", "In Progress")} in progress &nbsp;·&nbsp;
            {countBy("status", "Completed")} completed &nbsp;·&nbsp;
            {countBy("status", "Overdue")} overdue
          </p>
        </div>
        <div className="admin-hero-meta">
          {countBy("status", "Overdue") > 0 && (
            <span className="status-pill">{countBy("status", "Overdue")} Overdue</span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <section className="stat-grid premium-stats">
        {STATUSES.map((s) => (
          <article className="stat-card" key={s}>
            <h3>{s}</h3>
            <p>{countBy("status", s)}</p>
          </article>
        ))}
      </section>

      {error   && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      {/* Form panel */}
      {showForm && isAdminOrManager && (
        <section className="panel-card full-span" style={{ marginBottom: "14px" }}>
          <div className="panel-head">
            <h2>{editingId ? "Edit Milestone" : "New Milestone"}</h2>
            <button type="button" className="secondary-btn" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); }}>✕ Cancel</button>
          </div>
          <form className="project-form premium-project-form" onSubmit={handleSubmit}>
            <div className="project-form-row full">
              <label>Title *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Beta Launch" required minLength={2} autoFocus />
            </div>
            <div className="project-form-grid two-col">
              <div className="project-form-row">
                <label>Due Date</label>
                <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
              </div>
              <div className="project-form-row">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="project-form-row" style={{ gridColumn: "1 / -1" }}>
                <label>Project (optional)</label>
                <select name="projectId" value={form.projectId} onChange={handleChange}>
                  <option value="">— No Project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.project_title} ({p.project_code})</option>)}
                </select>
              </div>
            </div>
            <div className="project-form-row full">
              <label>Description</label>
              <textarea className="text-area" name="description" value={form.description} onChange={handleChange} placeholder="Key deliverables or acceptance criteria for this milestone..." rows={3} />
            </div>
            <div className="form-actions">
              <button type="submit">{editingId ? "Update Milestone" : "Create Milestone"}</button>
              <button type="button" className="secondary-btn" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {/* Table */}
      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>All Milestones</h2>
          <div className="action-row">
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={{ height: "34px", fontSize: "12px", margin: 0 }}>
              <option value="All">All Projects</option>
              {projects.map((p) => <option key={p.id} value={String(p.id)}>{p.project_title}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ height: "34px", fontSize: "12px", margin: 0 }}>
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {isAdminOrManager && !showForm && (
              <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}>+ New Milestone</button>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Days Left</th>
                <th>Created by</th>
                {isAdminOrManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ms) => {
                const days = daysUntil(ms.dueDate);
                const urgency = days === null ? "" : days < 0 ? "overdue" : days <= 3 ? "today" : days <= 7 ? "soon" : "ontrack";
                return (
                  <tr key={ms.id}>
                    <td>
                      <strong style={{ color: "#19314b" }}>{ms.title}</strong>
                      {ms.description && <><br /><span style={{ color: "#7a93b4", fontSize: "11px" }}>{ms.description.slice(0, 60)}{ms.description.length > 60 ? "…" : ""}</span></>}
                    </td>
                    <td style={{ color: "#4f6583" }}>{ms.Project?.project_title || <span style={{ color: "#b0bfcf" }}>—</span>}</td>
                    <td><span className={`status-chip ${STATUS_CHIP[ms.status] || ""}`}>{ms.status}</span></td>
                    <td style={{ color: "#4f6583", whiteSpace: "nowrap" }}>{ms.dueDate ? new Date(ms.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                    <td>
                      {days === null ? <span style={{ color: "#b0bfcf" }}>—</span> : (
                        <span className={`task-reminder-pill ${urgency}`}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: "12px", color: "#4f6583" }}>{ms.CreatedBy?.name || "—"}</td>
                    {isAdminOrManager && (
                      <td>
                        <div className="action-row">
                          <button type="button" className="secondary-btn" onClick={() => handleEdit(ms)}>Edit</button>
                          <button type="button" className="secondary-btn" onClick={() => handleDelete(ms.id)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: "32px 24px", textAlign: "center", color: "#7a93b4" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px", color: "#3d5678" }}>{milestones.length === 0 ? "No milestones yet" : "No milestones match the filters"}</p>
              {isAdminOrManager && milestones.length === 0 && <p style={{ margin: 0, fontSize: "13px" }}>Click "+ New Milestone" to add the first one.</p>}
            </div>
          )}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

export default Milestones;
