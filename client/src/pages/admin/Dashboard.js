import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuth,
  createCategory,
  createClient,
  createEmployeeOrManager,
  deleteCategory,
  deleteClient,
  getAdminStats,
  getApprovalPanel,
  getCategories,
  getClients,
  getCurrentUser,
  getInvoiceSettings,
  getUsers,
  generateInvoices,
  updateInvoiceSettings,
  updateUserStatus,
} from "../../services/auth";
import WorkspaceLayout from "../../components/WorkspaceLayout";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ users: 0, clients: 0, categories: 0 });
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [invoiceSettings, setInvoiceSettings] = useState({
    currency: "USD",
    tax_rate: 0,
    payment_terms_days: 30,
    usd_inr_rate: 83,
    default_hourly_rate_usd: 25,
    notes: "",
  });

  const [clientForm, setClientForm] = useState({ name: "", client_code: "" });
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role_name: "Employee",
    clientId: "",
  });
  const [categoryForm, setCategoryForm] = useState({ name: "", category_code: "" });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const nonAdminUsers = useMemo(
    () => users.filter((u) => u.Role?.name !== "Admin"),
    [users]
  );

  const loadAll = async () => {
    const [
      currentUser,
      statsData,
      clientsData,
      usersData,
      categoriesData,
      invoiceData,
      approvalsData,
    ] =
      await Promise.all([
        getCurrentUser(),
        getAdminStats(),
        getClients(),
        getUsers(),
        getCategories(),
        getInvoiceSettings(),
        getApprovalPanel(),
      ]);

    if (currentUser.role !== "Admin") {
      throw new Error("Only Admin can access this dashboard");
    }

    setUser(currentUser);
    setStats(statsData);
    setClients(clientsData);
    setUsers(usersData);
    setCategories(categoriesData);
    setInvoiceSettings({
      currency: invoiceData.currency || "USD",
      tax_rate: invoiceData.tax_rate || 0,
      payment_terms_days: invoiceData.payment_terms_days || 30,
      usd_inr_rate: invoiceData.usd_inr_rate || 83,
      default_hourly_rate_usd: invoiceData.default_hourly_rate_usd || 25,
      notes: invoiceData.notes || "",
    });
    setApprovals(approvalsData);
  };

  useEffect(() => {
    const init = async () => {
      setError("");
      try {
        await loadAll();
      } catch (err) {
        clearAuth();
        setError(err.response?.data?.message || err.message || "Session expired");
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleCreateClient = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createClient({
        name: clientForm.name,
        client_code: clientForm.client_code,
      });
      setClientForm({ name: "", client_code: "" });
      await loadAll();
      setSuccess("Client created");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create client");
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createEmployeeOrManager({
        ...employeeForm,
        clientId:
          employeeForm.role_name === "Client" && employeeForm.clientId
            ? Number(employeeForm.clientId)
            : null,
      });
      setEmployeeForm({
        name: "",
        username: "",
        email: "",
        password: "",
        role_name: "Employee",
        clientId: "",
      });
      await loadAll();
      setSuccess("Employee/Manager created with login credentials");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create employee");
    }
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createCategory(categoryForm);
      setCategoryForm({ name: "", category_code: "" });
      await loadAll();
      setSuccess("Task category created");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create category");
    }
  };

  const handleSaveInvoiceSettings = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await updateInvoiceSettings({
        ...invoiceSettings,
        tax_rate: Number(invoiceSettings.tax_rate),
        payment_terms_days: Number(invoiceSettings.payment_terms_days),
      });
      await loadAll();
      setSuccess("Invoice settings updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update invoice settings");
    }
  };

  const handleDeleteClient = async (id) => {
    setError("");
    setSuccess("");
    try {
      await deleteClient(id);
      await loadAll();
      setSuccess("Client deleted");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete client");
    }
  };

  const handleDeleteCategory = async (id) => {
    setError("");
    setSuccess("");
    try {
      await deleteCategory(id);
      await loadAll();
      setSuccess("Category deleted");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    setError("");
    setSuccess("");
    try {
      await updateUserStatus(id, !currentStatus);
      await loadAll();
      setSuccess("Approval panel updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update approval");
    }
  };

  const handleInvoiceUpdateFromApprovals = async () => {
    setError("");
    setSuccess("");
    try {
      const result = await generateInvoices();
      await loadAll();
      setSuccess(result.message || "Invoice updated from approved logs");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update invoice from approvals");
    }
  };

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading Admin Setup...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role="Admin"
      title="Admin Project Control"
      subtitle={`Logged in as ${user?.name} (${user?.username})`}
      onLogout={handleLogout}
      activeSection="Dashboard"
    >
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <section className="admin-hero">
        <div className="admin-hero-main">
          <h2>Milta Operations Hub</h2>
          <p>
            Unified control for clients, teams, categories, timesheets and invoice setup.
          </p>
        </div>
        <div className="admin-hero-meta">
          <span className="status-pill">System Active</span>
          <span className="status-pill subtle">Role: Admin</span>
        </div>
      </section>

      <div className="stat-grid premium-stats">
        <article className="stat-card">
          <h3>Clients</h3>
          <p>{stats.clients}</p>
        </article>
        <article className="stat-card">
          <h3>Employees + Managers</h3>
          <p>{nonAdminUsers.length}</p>
        </article>
        <article className="stat-card">
          <h3>Task Categories</h3>
          <p>{stats.categories}</p>
        </article>
        <article className="stat-card">
          <h3>Approval Accounts</h3>
          <p>{approvals.length}</p>
        </article>
      </div>

      <section className="admin-grid premium-grid">
          <article className="panel-card">
            <div className="panel-head">
              <h2>Client Management</h2>
              <span className="badge">{clients.length} Records</span>
            </div>
            <form className="auth-form" onSubmit={handleCreateClient}>
              <input
                placeholder="Client Name"
                value={clientForm.name}
                onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <input
                placeholder="Client Code"
                value={clientForm.client_code}
                onChange={(e) => setClientForm((p) => ({ ...p, client_code: e.target.value }))}
                required
              />
              <button type="submit">Add Client</button>
            </form>
            <div className="list-wrap">
              {clients.map((client) => (
                <div className="list-item polished-item" key={client.id}>
                  <span>
                    <strong>{client.name}</strong> ({client.client_code})<br />
                    Client profile created
                  </span>
                  <button onClick={() => handleDeleteClient(client.id)} type="button">Delete</button>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-head">
              <h2>Employee Management</h2>
              <span className="badge">{nonAdminUsers.length} Team Members</span>
            </div>
            <p>Admin creates username and password for employee/manager login.</p>
            <form className="auth-form" onSubmit={handleCreateUser}>
              <input placeholder="Full Name" value={employeeForm.name} onChange={(e) => setEmployeeForm((p) => ({ ...p, name: e.target.value }))} required />
              <input placeholder="Username" value={employeeForm.username} onChange={(e) => setEmployeeForm((p) => ({ ...p, username: e.target.value }))} required />
              <input placeholder="Email" type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))} required />
              <input placeholder="Password" type="password" value={employeeForm.password} onChange={(e) => setEmployeeForm((p) => ({ ...p, password: e.target.value }))} required />
              <select value={employeeForm.role_name} onChange={(e) => setEmployeeForm((p) => ({ ...p, role_name: e.target.value }))}>
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="Client">Client</option>
              </select>
              {employeeForm.role_name === "Client" ? (
                <select
                  value={employeeForm.clientId || ""}
                  onChange={(e) =>
                    setEmployeeForm((p) => ({ ...p, clientId: e.target.value }))
                  }
                  required
                >
                  <option value="">Link Client Profile</option>
                  {clients.map((client) => (
                    <option value={client.id} key={client.id}>
                      {client.name} ({client.client_code})
                    </option>
                  ))}
                </select>
              ) : null}
              <button type="submit">Create Login</button>
            </form>
            <div className="list-wrap">
              {nonAdminUsers.map((member) => (
                <div className="list-item polished-item" key={member.id}>
                  <span>
                    <strong>{member.name}</strong> ({member.username})<br />
                    {member.Role?.name}
                    {member.ClientAccount ? ` | ${member.ClientAccount.name}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-head">
              <h2>Task Categories</h2>
              <span className="badge">{categories.length} Categories</span>
            </div>
            <form className="auth-form" onSubmit={handleCreateCategory}>
              <input placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} required />
              <input placeholder="Category Code" value={categoryForm.category_code} onChange={(e) => setCategoryForm((p) => ({ ...p, category_code: e.target.value }))} required />
              <button type="submit">Add Category</button>
            </form>
            <div className="list-wrap">
              {categories.map((category) => (
                <div className="list-item polished-item" key={category.id}>
                  <span>
                    <strong>{category.name}</strong><br />
                    {category.category_code}
                  </span>
                  <button onClick={() => handleDeleteCategory(category.id)} type="button">Delete</button>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-head">
              <h2>Invoice Settings</h2>
              <span className="badge">Billing Profile</span>
            </div>
            <form className="auth-form" onSubmit={handleSaveInvoiceSettings}>
              <input placeholder="Currency" value={invoiceSettings.currency} onChange={(e) => setInvoiceSettings((p) => ({ ...p, currency: e.target.value }))} required />
              <input placeholder="Tax Rate (%)" type="number" min="0" step="0.01" value={invoiceSettings.tax_rate} onChange={(e) => setInvoiceSettings((p) => ({ ...p, tax_rate: e.target.value }))} required />
              <input placeholder="Payment Terms (days)" type="number" min="1" value={invoiceSettings.payment_terms_days} onChange={(e) => setInvoiceSettings((p) => ({ ...p, payment_terms_days: e.target.value }))} required />
              <input placeholder="USD to INR Rate" type="number" min="1" step="0.01" value={invoiceSettings.usd_inr_rate} onChange={(e) => setInvoiceSettings((p) => ({ ...p, usd_inr_rate: e.target.value }))} required />
              <input placeholder="Default Hourly Rate (USD)" type="number" min="0" step="0.01" value={invoiceSettings.default_hourly_rate_usd} onChange={(e) => setInvoiceSettings((p) => ({ ...p, default_hourly_rate_usd: e.target.value }))} required />
              <input placeholder="Notes" value={invoiceSettings.notes || ""} onChange={(e) => setInvoiceSettings((p) => ({ ...p, notes: e.target.value }))} />
              <button type="submit">Save Invoice Settings</button>
            </form>
          </article>

          <article className="panel-card full-span">
            <div className="panel-head">
              <h2>Approval Panel</h2>
              <span className="badge">{approvals.length} Accounts</span>
            </div>
            <p>Activate/Deactivate employee and manager access.</p>
            <div className="list-wrap">
              {approvals.map((entry) => (
                <div className="list-item polished-item" key={entry.id}>
                  <span>
                    <strong>{entry.name}</strong> ({entry.role})<br />
                    {entry.username}
                  </span>
                  <button type="button" onClick={() => handleToggleActive(entry.id, entry.is_active)}>
                    {entry.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-card full-span">
            <div className="panel-head">
              <h2>Time Logs & Billing</h2>
              <div className="action-row">
                <button type="button" onClick={handleInvoiceUpdateFromApprovals}>
                  Update Invoice
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => navigate("/admin/time-logs")}
                >
                  Open Time Logs
                </button>
              </div>
            </div>
            <p>Review employee time logs from the dedicated Time Logs page and generate invoices from approved entries.</p>
          </article>
      </section>
    </WorkspaceLayout>
  );
}

export default Dashboard;
