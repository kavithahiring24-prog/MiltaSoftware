import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  createProjectGroup,
  getCurrentUser,
  getProjectGroupStats,
  getProjects,
} from "../../services/auth";

const TILE_COLORS = [
  "#0b66e4", "#6366f1", "#ec4899", "#f59e0b",
  "#10b981", "#ef4444", "#8b5cf6", "#06b6d4",
  "#f97316", "#14b8a6",
];

function makeProjectRows(projects) {
  const seen = new Set();
  return projects.reduce((acc, project) => {
    if (seen.has(project.id)) return acc;
    seen.add(project.id);
    acc.push({
      id: project.project_code || `MI-${project.id}`,
      projectName: project.project_title,
      progress: project.progress || 0,
      owner: project.owner_name || "—",
      status: project.status || "Active",
      projectGroup: project.ProjectGroup?.code || project.project_group || project.Client?.client_code || "—",
      startDate: project.start_date || "—",
      endDate: project.end_date || "—",
      tags: project.tags || "",
    });
    return acc;
  }, []);
}

function Projects() {
  const navigate = useNavigate();
  const [user, setUser]                   = useState(null);
  const [projects, setProjects]           = useState([]);
  const [error, setError]                 = useState("");
  const [activeTab, setActiveTab]         = useState("Active Projects");
  const [newGroupName, setNewGroupName]   = useState("");
  const [newGroupCode, setNewGroupCode]   = useState("");
  const [groupStats, setGroupStats]       = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isLoading, setIsLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        const [projectData, groupsData] = await Promise.all([getProjects(), getProjectGroupStats()]);
        setProjects(projectData);
        setGroupStats(groupsData);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load projects");
        clearAuth();
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate]);

  const rows      = useMemo(() => makeProjectRows(projects), [projects]);
  const groupRows = useMemo(() => groupStats || [], [groupStats]);

  const filteredRows = useMemo(() => {
    if (activeTab === "Active Projects")   return rows.filter((r) => r.status !== "Completed");
    if (activeTab === "Archived Projects") return rows.filter((r) => r.status === "Completed");
    return rows;
  }, [rows, activeTab]);

  const handleCreateGroup = async () => {
    const trimmed = newGroupName.trim();
    const code    = newGroupCode.trim().toUpperCase();
    if (!trimmed || !code) return;
    try {
      await createProjectGroup({ name: trimmed, code });
      const groupsData = await getProjectGroupStats();
      setGroupStats(groupsData);
      setNewGroupName("");
      setNewGroupCode("");
      setShowGroupModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    }
  };

  const handleLogout = () => { clearAuth(); navigate("/login", { replace: true }); };

  if (isLoading) {
    return <main className="auth-layout"><section className="auth-card"><h2>Loading projects...</h2></section></main>;
  }

  return (
    <WorkspaceLayout
      role={user?.role || "Workspace"}
      title="Projects"
      subtitle={`${rows.length} project${rows.length !== 1 ? "s" : ""} · ${user?.name || ""}`}
      onLogout={handleLogout}
      activeSection="Projects"
    >
      {error ? <p className="error-text">{error}</p> : null}

      {/* Tabs */}
      <section className="project-tabs">
        {["Active Projects", "Project Groups", "Archived Projects"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </section>

      {/* Toolbar */}
      <section className="project-toolbar">
        {activeTab === "Project Groups" ? (
          <button type="button" onClick={() => setShowGroupModal(true)}>+ New Group</button>
        ) : (
          <button type="button" onClick={() => navigate("/projects/new")}>+ New Project</button>
        )}
      </section>

      {/* Content */}
      {activeTab === "Project Groups" ? (
        <section className="project-groups-grid">
          {groupRows.map((group) => (
            <article className="project-group-card" key={group.name}>
              <div className="group-avatar">
                {(group.code || group.name).replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "PG"}
              </div>
              <div>
                <h3>{group.code}</h3>
                <p>{group.name}</p>
                <p>{group.projectCount || 0} project{(group.projectCount || 0) === 1 ? "" : "s"}</p>
              </div>
            </article>
          ))}
          {groupRows.length === 0 && (
            <div className="project-tile-empty">
              <p>No project groups yet</p>
              <p>Click "+ New Group" to create one.</p>
            </div>
          )}
        </section>
      ) : (
        <div className="project-tiles-grid">
          {filteredRows.map((row, idx) => {
            const color    = TILE_COLORS[idx % TILE_COLORS.length];
            const progress = Math.min(100, Math.max(0, row.progress));
            return (
              <div className="project-tile" key={row.id} onClick={() => navigate(`/projects/${projects[idx].id}`)} style={{ cursor: "pointer" }}>
                <div className="project-tile-accent" style={{ background: color }} />
                <div className="project-tile-body">
                  <div className="project-tile-top">
                    <span className="project-tile-code">{row.id}</span>
                    <span className={`status-chip ${(row.status || "active").toLowerCase().replace(/\s+/g, "-")}`}>
                      {row.status}
                    </span>
                  </div>

                  <h3 className="project-tile-name">{row.projectName}</h3>
                  <p className="project-tile-owner">{row.owner !== "—" ? `Owner: ${row.owner}` : "No owner assigned"}</p>

                  <div className="project-tile-progress-track">
                    <div
                      className="project-tile-progress-fill"
                      style={{ width: `${progress}%`, background: color }}
                    />
                  </div>
                  <div className="project-tile-progress-label">
                    <span>{progress}% complete</span>
                    {row.projectGroup !== "—" && <span>Group: {row.projectGroup}</span>}
                  </div>

                  <div className="project-tile-footer">
                    <div className="project-tile-footer-group">
                      <span className="project-tile-meta-item">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {row.startDate !== "—" ? row.startDate : "No start"}
                      </span>
                    </div>
                    <span className="project-tile-meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {row.endDate !== "—" ? row.endDate : "No deadline"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRows.length === 0 && (
            <div className="project-tile-empty">
              <p>{activeTab === "Archived Projects" ? "No archived projects" : "No active projects yet"}</p>
              <p>{activeTab !== "Archived Projects" ? "Click \"+ New Project\" to get started." : ""}</p>
            </div>
          )}
        </div>
      )}

      {showGroupModal && (
        <section className="modal-overlay">
          <div className="modal-card">
            <h3>Create Project Group</h3>
            <input
              className="group-input"
              placeholder="Group Name (e.g., Web Development)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <input
              className="group-input"
              placeholder="Group Code (e.g., WD)"
              value={newGroupCode}
              onChange={(e) => setNewGroupCode(e.target.value)}
            />
            <div className="form-actions">
              <button type="button" onClick={handleCreateGroup}>Create Group</button>
              <button type="button" className="secondary-btn" onClick={() => setShowGroupModal(false)}>Cancel</button>
            </div>
          </div>
        </section>
      )}
    </WorkspaceLayout>
  );
}

export default Projects;
