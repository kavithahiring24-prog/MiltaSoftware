import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  createProject,
  getCurrentUser,
  getClients,
  getProjectGroups,
  getProjects,
} from "../../services/auth";

const initialForm = {
  projectTitle: "",
  owner: "",
  startDate: "",
  endDate: "",
  projectGroup: "",
  projectGroupId: "",
  clientId: "",
  description: "",
  tags: "",
  projectAccess: "Private",
};

function NewProject() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [groups, setGroups]   = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm]       = useState(initialForm);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!["Admin", "Manager"].includes(currentUser.role)) {
          throw new Error("Only Admin/Manager can create projects");
        }
        const [groupsData, projectsData, clientsData] = await Promise.all([
          getProjectGroups(),
          getProjects(),
          currentUser.role === "Admin" ? getClients() : Promise.resolve([]),
        ]);
        setUser(currentUser);
        setGroups(groupsData || []);
        setProjects(projectsData || []);
        setClients(clientsData || []);
        setForm((prev) => ({
          ...prev,
          owner: currentUser.name || currentUser.username || "",
        }));
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to open New Project");
        clearAuth();
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onGroupChange = (e) => {
    const selectedId = Number(e.target.value);
    const selected = groups.find((g) => g.id === selectedId);
    setForm((prev) => ({
      ...prev,
      projectGroupId: selectedId || "",
      projectGroup: selected?.code || "",
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.projectTitle.trim()) {
      setError("Project Title is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await createProject(form);
      setSuccess("Project created successfully!");
      setTimeout(() => navigate("/projects"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading project form...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role={user?.role || "Workspace"}
      title="Projects"
      subtitle="Create and configure a new project"
      onLogout={handleLogout}
      activeSection="Projects"
    >
      <div className="new-project-overlay">
        {/* Background context: existing projects list */}
        <section className="new-project-context">
          <div className="new-project-context-tabs">
            <span className="active">Active Projects</span>
            <span>Project Templates</span>
            <span>Project Groups</span>
            <span>Public Projects</span>
            <span>Archived Projects</span>
          </div>
          <section className="new-project-context-table">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Project Name</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Group</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 8).map((project) => (
                  <tr key={project.id}>
                    <td>{project.project_code || `MI-${project.id}`}</td>
                    <td>{project.project_title || "—"}</td>
                    <td>{project.owner_name || "—"}</td>
                    <td>
                      <span
                        className={`status-chip ${
                          project.status === "Completed"
                            ? "completed"
                            : project.status === "In Progress"
                            ? "in-progress"
                            : "active"
                        }`}
                      >
                        {project.status || "Active"}
                      </span>
                    </td>
                    <td>{project.ProjectGroup?.code || project.project_group || "—"}</td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#7a93b4" }}>
                      No projects yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </section>

        <div className="new-project-backdrop" />

        {/* Drawer: the actual form */}
        <section className="new-project-drawer">
          <header className="new-project-header">
            <div>
              <h2>New Project</h2>
              <p>Standard Layout &nbsp;·&nbsp; Fill in the details below</p>
            </div>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/projects")}
              style={{ margin: 0, whiteSpace: "nowrap" }}
            >
              ← Back to Projects
            </button>
          </header>

          <form className="project-form premium-project-form" onSubmit={onSubmit}>
            {/* Feedback inside form, same horizontal padding as fields */}
            {error   && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{success}</p>}

            {/* Project Title */}
            <div className="project-form-row full">
              <label>Project Title *</label>
              <input
                name="projectTitle"
                value={form.projectTitle}
                onChange={onChange}
                placeholder="e.g. Client Portal Redesign"
                required
                autoFocus
              />
            </div>

            {/* Owner + Dates */}
            <div className="project-form-grid two-col">
              <div className="project-form-row">
                <label>Owner / Lead</label>
                <input
                  name="owner"
                  value={form.owner}
                  onChange={onChange}
                  placeholder="Project owner name"
                />
              </div>

              <div className="project-form-row">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={onChange}
                />
              </div>

              <div className="project-form-row">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={onChange}
                />
              </div>

              {/* Client (Admin only) */}
              {user?.role === "Admin" && clients.length > 0 && (
                <div className="project-form-row">
                  <label>Client (optional)</label>
                  <select name="clientId" value={form.clientId} onChange={onChange}>
                    <option value="">— No Client —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.client_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Project Group */}
            <div className="project-form-row full">
              <label>Project Group</label>
              <div className="project-group-row">
                <select
                  name="projectGroupId"
                  value={form.projectGroupId || ""}
                  onChange={onGroupChange}
                  style={{ flex: 1 }}
                >
                  <option value="">— Select a group —</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.code} — {group.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="drawer-link-btn"
                  onClick={() => navigate("/projects")}
                >
                  + New group
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="project-form-row full">
              <label>Description</label>
              <div className="editor-toolbar">
                <span>B</span>
                <span>I</span>
                <span>U</span>
                <span>·</span>
                <span>List</span>
                <span>·</span>
                <span>Link</span>
                <span>·</span>
                <span>Code</span>
              </div>
              <textarea
                className="text-area large-editor"
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Describe the project scope, goals, and key deliverables..."
              />
            </div>

            {/* Tags */}
            <div className="project-form-row full">
              <label>Tags</label>
              <input
                name="tags"
                value={form.tags}
                onChange={onChange}
                placeholder="e.g. design, backend, urgent (comma-separated)"
              />
            </div>

            {/* Access */}
            <section className="project-subsection">
              <h3>Project Access</h3>
              <div className="radio-grid">
                <label>
                  <input
                    type="radio"
                    name="projectAccess"
                    value="Private"
                    checked={form.projectAccess === "Private"}
                    onChange={onChange}
                  />
                  Private — only assigned members
                </label>
                <label>
                  <input
                    type="radio"
                    name="projectAccess"
                    value="Public"
                    checked={form.projectAccess === "Public"}
                    onChange={onChange}
                  />
                  Public — all workspace members
                </label>
              </div>
            </section>

            {/* Actions */}
            <div className="form-actions">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create Project"}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate("/projects")}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </WorkspaceLayout>
  );
}

export default NewProject;
