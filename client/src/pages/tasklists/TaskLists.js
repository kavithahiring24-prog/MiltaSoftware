import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  createTaskList,
  deleteTaskList,
  getCurrentUser,
  getProjects,
  getTaskLists,
  updateTaskList,
} from "../../services/auth";

const EMPTY_FORM = { name: "", description: "", sort_order: 0, projectId: "" };

function TaskLists() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [taskLists, setTaskLists] = useState([]);
  const [projects, setProjects]   = useState([]);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [filterProject, setFilterProject] = useState("All");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isAdminOrManager = ["Admin", "Manager"].includes(user?.role);

  const loadData = async () => {
    const [currentUser, listData, projData] = await Promise.all([
      getCurrentUser(),
      getTaskLists(),
      getProjects().catch(() => []),
    ]);
    setUser(currentUser);
    setTaskLists(listData || []);
    setProjects(projData || []);
  };

  useEffect(() => {
    const load = async () => {
      try { await loadData(); }
      catch (err) {
        setError(err.response?.data?.message || "Failed to load task lists");
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
      const payload = { ...form, projectId: form.projectId || null, sort_order: Number(form.sort_order) || 0 };
      if (editingId) {
        await updateTaskList(editingId, payload);
        setSuccess("Task list updated.");
      } else {
        await createTaskList(payload);
        setSuccess("Task list created.");
      }
      setForm(EMPTY_FORM); setEditingId(null); setShowForm(false);
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to save task list"); }
  };

  const handleEdit = (list) => {
    setForm({
      name: list.name || "",
      description: list.description || "",
      sort_order: list.sort_order ?? 0,
      projectId: list.projectId || "",
    });
    setEditingId(list.id); setShowForm(true); setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task list? All tasks must be removed first.")) return;
    setError(""); setSuccess("");
    try { await deleteTaskList(id); setSuccess("Task list deleted."); await loadData(); }
    catch (err) { setError(err.response?.data?.message || "Failed to delete"); }
  };

  const filtered = taskLists.filter((l) => {
    if (filterProject !== "All" && String(l.projectId) !== filterProject) return false;
    return true;
  });

  if (isLoading) {
    return <main className="auth-layout"><section className="auth-card"><h2>Loading task lists...</h2></section></main>;
  }

  return (
    <WorkspaceLayout
      role={user?.role}
      title="Task Lists"
      subtitle={`Manage task list buckets within projects · ${user?.name || ""}`}
      onLogout={handleLogout}
      activeSection="Task Lists"
    >
      <div className="admin-hero">
        <div className="admin-hero-main">
          <h2>Task Lists</h2>
          <p>{taskLists.length} list{taskLists.length !== 1 ? "s" : ""} across {projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="admin-hero-meta">
          <span className="status-pill">{projects.length} Projects</span>
        </div>
      </div>

      <section className="stat-grid premium-stats">
        <article className="stat-card"><h3>Total Lists</h3><p>{taskLists.length}</p></article>
        <article className="stat-card"><h3>Linked to Projects</h3><p>{taskLists.filter((l) => l.projectId).length}</p></article>
        <article className="stat-card"><h3>Unlinked</h3><p>{taskLists.filter((l) => !l.projectId).length}</p></article>
        <article className="stat-card"><h3>Projects</h3><p>{projects.length}</p></article>
      </section>

      {error   && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      {showForm && isAdminOrManager && (
        <section className="panel-card full-span" style={{ marginBottom: "14px" }}>
          <div className="panel-head">
            <h2>{editingId ? "Edit Task List" : "New Task List"}</h2>
            <button type="button" className="secondary-btn" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); }}>✕ Cancel</button>
          </div>
          <form className="project-form premium-project-form" onSubmit={handleSubmit}>
            <div className="project-form-grid two-col">
              <div className="project-form-row">
                <label>List Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Backlog, Sprint 1, In Review" required minLength={1} autoFocus />
              </div>
              <div className="project-form-row">
                <label>Sort Order</label>
                <input type="number" name="sort_order" value={form.sort_order} onChange={handleChange} min={0} placeholder="0" />
              </div>
              <div className="project-form-row" style={{ gridColumn: "1 / -1" }}>
                <label>Link to Project (optional)</label>
                <select name="projectId" value={form.projectId} onChange={handleChange}>
                  <option value="">— No Project —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.project_title} ({p.project_code})</option>)}
                </select>
              </div>
            </div>
            <div className="project-form-row full">
              <label>Description</label>
              <textarea className="text-area" name="description" value={form.description} onChange={handleChange} placeholder="What kind of tasks belong in this list..." rows={2} />
            </div>
            <div className="form-actions">
              <button type="submit">{editingId ? "Update Task List" : "Create Task List"}</button>
              <button type="button" className="secondary-btn" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>All Task Lists</h2>
          <div className="action-row">
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={{ height: "34px", fontSize: "12px", margin: 0 }}>
              <option value="All">All Projects</option>
              {projects.map((p) => <option key={p.id} value={String(p.id)}>{p.project_title}</option>)}
            </select>
            {isAdminOrManager && !showForm && (
              <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}>+ New Task List</button>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Project</th>
                <th>Sort Order</th>
                <th>Description</th>
                {isAdminOrManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((list) => (
                <tr key={list.id}>
                  <td><strong style={{ color: "#19314b" }}>{list.name}</strong></td>
                  <td style={{ color: "#4f6583" }}>{list.Project?.project_title || <span style={{ color: "#b0bfcf" }}>—</span>}</td>
                  <td style={{ color: "#4f6583" }}>{list.sort_order}</td>
                  <td style={{ color: "#7a93b4", fontSize: "12px" }}>{list.description ? `${list.description.slice(0, 60)}${list.description.length > 60 ? "…" : ""}` : "—"}</td>
                  {isAdminOrManager && (
                    <td>
                      <div className="action-row">
                        <button type="button" className="secondary-btn" onClick={() => handleEdit(list)}>Edit</button>
                        <button type="button" className="secondary-btn" onClick={() => handleDelete(list.id)}>Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: "32px 24px", textAlign: "center", color: "#7a93b4" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px", color: "#3d5678" }}>
                {taskLists.length === 0 ? "No task lists yet" : "No task lists match the filter"}
              </p>
              {isAdminOrManager && taskLists.length === 0 && <p style={{ margin: 0, fontSize: "13px" }}>Click "+ New Task List" to create the first one.</p>}
            </div>
          )}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

export default TaskLists;
