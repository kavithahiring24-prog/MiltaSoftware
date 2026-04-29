import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  createIssue,
  deleteIssue,
  getCurrentUser,
  getIssues,
  getProjects,
  updateIssue,
} from "../../services/auth";

const TYPES = ["Bug", "Feature Request", "Improvement", "Question", "Other"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

const PRIORITY_CHIP = {
  Low:      "completed",
  Medium:   "in-progress",
  High:     "active",
  Critical: "active",
};

const STATUS_CHIP = {
  Open:         "active",
  "In Progress":"in-progress",
  Resolved:     "completed",
  Closed:       "",
};

const TYPE_ICON = {
  Bug:               "🐛",
  "Feature Request": "✨",
  Improvement:       "⚡",
  Question:          "❓",
  Other:             "📌",
};

const EMPTY_FORM = {
  title:       "",
  description: "",
  type:        "Bug",
  status:      "Open",
  priority:    "Medium",
  projectId:   "",
};

function Issues() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [issues, setIssues]       = useState([]);
  const [projects, setProjects]   = useState([]);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isAdminOrManager = user?.role === "Admin" || user?.role === "Manager";

  const loadData = async () => {
    const [currentUser, issueList, projectList] = await Promise.all([
      getCurrentUser(),
      getIssues(),
      getProjects().catch(() => []),
    ]);
    setUser(currentUser);
    setIssues(issueList || []);
    setProjects(projectList || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadData();
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load issues");
        if (err.response?.status === 401) {
          clearAuth();
          navigate("/login", { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = { ...form, projectId: form.projectId || null };
      if (editingId) {
        await updateIssue(editingId, payload);
        setSuccess("Issue updated successfully.");
      } else {
        await createIssue(payload);
        setSuccess("Issue reported successfully.");
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save issue");
    }
  };

  const handleEdit = (issue) => {
    setForm({
      title:       issue.title || "",
      description: issue.description || "",
      type:        issue.type || "Bug",
      status:      issue.status || "Open",
      priority:    issue.priority || "Medium",
      projectId:   issue.projectId || "",
    });
    setEditingId(issue.id);
    setShowForm(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this issue? This cannot be undone.")) return;
    setError("");
    setSuccess("");
    try {
      await deleteIssue(id);
      setSuccess("Issue deleted.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete issue");
    }
  };

  const handleCancelForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const filtered = issues.filter((issue) => {
    if (filterStatus !== "All" && issue.status !== filterStatus) return false;
    if (filterPriority !== "All" && issue.priority !== filterPriority) return false;
    return true;
  });

  const countBy = (key, val) => issues.filter((i) => i[key] === val).length;

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading issues...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role={user?.role}
      title="Issue Tracker"
      subtitle={`Bugs, requests & improvements${user?.name ? " · " + user.name : ""}`}
      onLogout={handleLogout}
      activeSection="Issues"
    >
      {/* Hero Banner */}
      <div className="admin-hero">
        <div className="admin-hero-main">
          <h2>Issue Tracker</h2>
          <p>
            {issues.length} total &nbsp;·&nbsp;
            {countBy("status", "Open")} open &nbsp;·&nbsp;
            {countBy("status", "In Progress")} in progress &nbsp;·&nbsp;
            {countBy("status", "Resolved")} resolved
          </p>
        </div>
        <div className="admin-hero-meta">
          {countBy("priority", "Critical") > 0 && (
            <span className="status-pill">
              {countBy("priority", "Critical")} Critical
            </span>
          )}
          {countBy("priority", "High") > 0 && (
            <span className="status-pill subtle">
              {countBy("priority", "High")} High
            </span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <section className="stat-grid premium-stats">
        {STATUSES.map((s) => (
          <article className="stat-card" key={s}>
            <h3>{s}</h3>
            <p>{countBy("status", s)}</p>
          </article>
        ))}
      </section>

      {/* Feedback */}
      {error   && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      {/* Create / Edit Form */}
      {showForm && (
        <section className="panel-card full-span" style={{ marginBottom: "14px" }}>
          <div className="panel-head">
            <h2>{editingId ? "Edit Issue" : "Report New Issue"}</h2>
            <button type="button" className="secondary-btn" onClick={handleCancelForm}>
              ✕ Cancel
            </button>
          </div>

          <form className="project-form premium-project-form" onSubmit={handleSubmit}>
            <div className="project-form-row full">
              <label>Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Short description of the issue"
                required
                minLength={3}
                autoFocus
              />
            </div>

            <div className="project-form-grid two-col">
              <div className="project-form-row">
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleFormChange}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_ICON[t]} {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="project-form-row">
                <label>Priority</label>
                <select name="priority" value={form.priority} onChange={handleFormChange}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="project-form-row">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleFormChange}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="project-form-row">
                <label>Linked Project (optional)</label>
                <select name="projectId" value={form.projectId} onChange={handleFormChange}>
                  <option value="">— No Project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_title} ({p.project_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="project-form-row full">
              <label>Description</label>
              <div className="editor-toolbar">
                <span>Steps to reproduce</span>
                <span>·</span>
                <span>Expected vs Actual</span>
                <span>·</span>
                <span>Environment</span>
              </div>
              <textarea
                className="text-area large-editor"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Describe the issue in detail — steps to reproduce, expected vs actual behavior, environment..."
              />
            </div>

            <div className="form-actions">
              <button type="submit">
                {editingId ? "Update Issue" : "Submit Issue"}
              </button>
              <button type="button" className="secondary-btn" onClick={handleCancelForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter Bar + Table */}
      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>All Issues</h2>
          <div className="action-row">
            {/* Status filter tabs */}
            <div className="project-tabs">
              {["All", ...STATUSES].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`tab-btn${filterStatus === s ? " active" : ""}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s}
                  {s !== "All" && (
                    <span
                      style={{
                        marginLeft: "5px",
                        background: filterStatus === s ? "#cfe0ff" : "#edf3fb",
                        color: filterStatus === s ? "#0b66e4" : "#4a6382",
                        borderRadius: "999px",
                        padding: "1px 6px",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {countBy("status", s)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ height: "34px", fontSize: "12px", margin: 0 }}
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {!showForm && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                + Report Issue
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Issue</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Project</th>
                <th>Reporter</th>
                <th>Assignee</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue, idx) => (
                <tr key={issue.id}>
                  <td style={{ color: "#7a93b4", fontWeight: 700 }}>
                    #{issue.id}
                  </td>
                  <td>
                    <strong style={{ color: "#19314b", fontSize: "13px" }}>
                      {issue.title}
                    </strong>
                    {issue.description && (
                      <>
                        <br />
                        <span style={{ color: "#7a93b4", fontSize: "11px" }}>
                          {issue.description.length > 70
                            ? issue.description.slice(0, 70) + "…"
                            : issue.description}
                        </span>
                      </>
                    )}
                  </td>
                  <td>
                    <span className="task-summary-chip neutral">
                      {TYPE_ICON[issue.type]} {issue.type}
                    </span>
                  </td>
                  <td>
                    <span className={`status-chip ${PRIORITY_CHIP[issue.priority] || ""}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-chip ${STATUS_CHIP[issue.status] || ""}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td style={{ color: "#4f6583" }}>
                    {issue.Project?.project_title || (
                      <span style={{ color: "#b0bfcf" }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong style={{ fontSize: "12px" }}>
                      {issue.Reporter?.name || "—"}
                    </strong>
                  </td>
                  <td style={{ color: "#4f6583" }}>
                    {issue.Assignee?.name || (
                      <span style={{ color: "#b0bfcf" }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ color: "#7a93b4", whiteSpace: "nowrap" }}>
                    {new Date(issue.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <div className="action-row">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleEdit(issue)}
                      >
                        Edit
                      </button>
                      {isAdminOrManager && (
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => handleDelete(issue.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div
              style={{
                padding: "36px 24px",
                textAlign: "center",
                color: "#7a93b4",
              }}
            >
              {issues.length === 0 ? (
                <>
                  <p style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px", color: "#3d5678" }}>
                    No issues yet
                  </p>
                  <p style={{ margin: 0, fontSize: "13px" }}>
                    Click "Report Issue" to log a bug, feature request, or improvement.
                  </p>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: "13px" }}>
                  No issues match the current filters. Try changing the status or priority filter.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

export default Issues;
