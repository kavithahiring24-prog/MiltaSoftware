import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  createOrganization,
  deleteOrganization,
  getCurrentUser,
  getOrganizations,
  getUsers,
  assignOrgMember,
  removeOrgMember,
  updateOrganization,
} from "../../services/auth";

const EMPTY_FORM = { name: "", code: "", description: "" };

function Organizations() {
  const navigate = useNavigate();
  const [user, setUser]                   = useState(null);
  const [orgs, setOrgs]                   = useState([]);
  const [users, setUsers]                 = useState([]);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [editingId, setEditingId]         = useState(null);
  const [showForm, setShowForm]           = useState(false);
  const [expandedId, setExpandedId]       = useState(null);
  const [assignUserId, setAssignUserId]   = useState("");
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState("");
  const [isLoading, setIsLoading]         = useState(true);

  const loadData = async () => {
    const [currentUser, orgData, userData] = await Promise.all([
      getCurrentUser(),
      getOrganizations(),
      getUsers().catch(() => []),
    ]);
    setUser(currentUser);
    setOrgs(orgData || []);
    setUsers(userData || []);
  };

  useEffect(() => {
    const load = async () => {
      try { await loadData(); }
      catch (err) {
        setError(err.response?.data?.message || "Failed to load organizations");
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
      if (editingId) {
        await updateOrganization(editingId, { name: form.name, description: form.description });
        setSuccess("Organization updated.");
      } else {
        await createOrganization(form);
        setSuccess("Organization created.");
      }
      setForm(EMPTY_FORM); setEditingId(null); setShowForm(false);
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to save organization"); }
  };

  const handleEdit = (org) => {
    setForm({ name: org.name || "", code: org.code || "", description: org.description || "" });
    setEditingId(org.id); setShowForm(true); setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this organization? All members will be unlinked.")) return;
    setError(""); setSuccess("");
    try { await deleteOrganization(id); setSuccess("Organization deleted."); await loadData(); }
    catch (err) { setError(err.response?.data?.message || "Failed to delete"); }
  };

  const handleToggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const handleAssignMember = async (orgId) => {
    if (!assignUserId) return;
    setError(""); setSuccess("");
    try {
      await assignOrgMember(orgId, Number(assignUserId));
      setSuccess("Member assigned."); setAssignUserId("");
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to assign member"); }
  };

  const handleRemoveMember = async (orgId, userId) => {
    setError(""); setSuccess("");
    try {
      await removeOrgMember(orgId, userId);
      setSuccess("Member removed."); await loadData();
    } catch (err) { setError(err.response?.data?.message || "Failed to remove member"); }
  };

  const getOrgMembers = (orgId) => users.filter((u) => u.organizationId === orgId);

  const unassignedUsers = users.filter((u) => !u.organizationId && u.role !== "Client");

  if (isLoading) {
    return <main className="auth-layout"><section className="auth-card"><h2>Loading organizations...</h2></section></main>;
  }

  return (
    <WorkspaceLayout
      role={user?.role}
      title="Organizations"
      subtitle={`Manage workspace organizations · ${user?.name || ""}`}
      onLogout={handleLogout}
      activeSection="Organizations"
    >
      <div className="admin-hero">
        <div className="admin-hero-main">
          <h2>Organizations</h2>
          <p>{orgs.length} organization{orgs.length !== 1 ? "s" : ""} · {users.filter((u) => u.organizationId).length} members assigned</p>
        </div>
        <div className="admin-hero-meta">
          <span className="status-pill">{unassignedUsers.length} unassigned users</span>
        </div>
      </div>

      <section className="stat-grid premium-stats">
        <article className="stat-card"><h3>Total</h3><p>{orgs.length}</p></article>
        <article className="stat-card"><h3>Active</h3><p>{orgs.filter((o) => o.is_active).length}</p></article>
        <article className="stat-card"><h3>Members</h3><p>{users.filter((u) => u.organizationId).length}</p></article>
        <article className="stat-card"><h3>Unassigned</h3><p>{unassignedUsers.length}</p></article>
      </section>

      {error   && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      {showForm && (
        <section className="panel-card full-span" style={{ marginBottom: "14px" }}>
          <div className="panel-head">
            <h2>{editingId ? "Edit Organization" : "New Organization"}</h2>
            <button type="button" className="secondary-btn" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); }}>✕ Cancel</button>
          </div>
          <form className="project-form premium-project-form" onSubmit={handleSubmit}>
            <div className="project-form-grid two-col">
              <div className="project-form-row">
                <label>Organization Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Milta Finance" required minLength={2} autoFocus />
              </div>
              {!editingId && (
                <div className="project-form-row">
                  <label>Code *</label>
                  <input name="code" value={form.code} onChange={handleChange} placeholder="e.g. MF" required minLength={2} maxLength={20} style={{ textTransform: "uppercase" }} />
                </div>
              )}
            </div>
            <div className="project-form-row full">
              <label>Description</label>
              <textarea className="text-area" name="description" value={form.description} onChange={handleChange} placeholder="Brief description of this organization..." rows={2} />
            </div>
            <div className="form-actions">
              <button type="submit">{editingId ? "Update Organization" : "Create Organization"}</button>
              <button type="button" className="secondary-btn" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>All Organizations</h2>
          {!showForm && (
            <button type="button" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}>+ New Organization</button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Members</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                const members = getOrgMembers(org.id);
                const isExpanded = expandedId === org.id;
                return (
                  <>
                    <tr key={org.id}>
                      <td>
                        <strong style={{ color: "#19314b" }}>{org.name}</strong>
                        {org.description && <><br /><span style={{ color: "#7a93b4", fontSize: "11px" }}>{org.description.slice(0, 60)}{org.description.length > 60 ? "…" : ""}</span></>}
                      </td>
                      <td><span className="badge">{org.code}</span></td>
                      <td>
                        <button type="button" className="secondary-btn" style={{ fontSize: "12px" }} onClick={() => handleToggleExpand(org.id)}>
                          {members.length} member{members.length !== 1 ? "s" : ""} {isExpanded ? "▲" : "▼"}
                        </button>
                      </td>
                      <td><span className={`status-chip ${org.is_active ? "active" : ""}`}>{org.is_active ? "Active" : "Inactive"}</span></td>
                      <td>
                        <div className="action-row">
                          <button type="button" className="secondary-btn" onClick={() => handleEdit(org)}>Edit</button>
                          <button type="button" className="secondary-btn" onClick={() => handleDelete(org.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${org.id}-expand`}>
                        <td colSpan={5} style={{ background: "#f4f8fd", padding: "14px 20px" }}>
                          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "200px" }}>
                              <p style={{ fontWeight: 700, color: "#19314b", marginBottom: "8px" }}>Current Members</p>
                              {members.length === 0
                                ? <p style={{ color: "#7a93b4", fontSize: "13px" }}>No members assigned yet.</p>
                                : members.map((m) => (
                                    <div key={m.id} className="list-item polished-item" style={{ padding: "6px 10px", marginBottom: "4px" }}>
                                      <span style={{ fontSize: "13px" }}><strong>{m.name}</strong> <span style={{ color: "#7a93b4" }}>({m.role})</span></span>
                                      <button type="button" className="secondary-btn" style={{ fontSize: "11px" }} onClick={() => handleRemoveMember(org.id, m.id)}>Remove</button>
                                    </div>
                                  ))
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: "200px" }}>
                              <p style={{ fontWeight: 700, color: "#19314b", marginBottom: "8px" }}>Assign Member</p>
                              <div className="action-row">
                                <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} style={{ flex: 1, height: "34px", fontSize: "13px" }}>
                                  <option value="">Select user…</option>
                                  {unassignedUsers.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                  ))}
                                </select>
                                <button type="button" onClick={() => handleAssignMember(org.id)} disabled={!assignUserId}>Assign</button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          {orgs.length === 0 && (
            <div style={{ padding: "32px 24px", textAlign: "center", color: "#7a93b4" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px", color: "#3d5678" }}>No organizations yet</p>
              <p style={{ margin: 0, fontSize: "13px" }}>Click "+ New Organization" to create the first one.</p>
            </div>
          )}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

export default Organizations;
