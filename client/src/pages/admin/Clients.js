import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  createEmployeeOrManager,
  getClients,
  getCurrentUser,
  getUsers,
} from "../../services/auth";

function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [clientUsers, setClientUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    clientId: "",
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser.role !== "Admin") {
      throw new Error("Only Admin can access clients visibility");
    }
    const [clientsData, usersData] = await Promise.all([getClients(), getUsers()]);
    setClients(clientsData || []);
    setClientUsers((usersData || []).filter((u) => u.Role?.name === "Client"));
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadData();
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load clients");
        clearAuth();
        navigate("/login", { replace: true });
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

  const handleCreateClientLogin = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createEmployeeOrManager({
        ...form,
        role_name: "Client",
        clientId: Number(form.clientId),
      });
      setForm({ clientId: "", name: "", username: "", email: "", password: "" });
      await loadData();
      setSuccess("Client login created successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create client login");
    }
  };

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading clients...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role="Admin"
      title="Clients"
      subtitle="Client visibility and hourly rates"
      onLogout={handleLogout}
      activeSection="Clients"
    >
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>Create Client Login</h2>
          <span className="badge">Admin Only</span>
        </div>
        <form className="auth-form" onSubmit={handleCreateClientLogin}>
          <select
            value={form.clientId}
            onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
            required
          >
            <option value="">Select Client</option>
            {clients.map((client) => (
              <option value={client.id} key={client.id}>
                {client.name} ({client.client_code})
              </option>
            ))}
          </select>
          <input
            placeholder="Client User Full Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
            minLength={6}
          />
          <button type="submit">Create Client Login</button>
        </form>
      </section>

      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>All Clients</h2>
          <span className="badge">{clients.length} Records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Client Code</th>
                <th>Hourly Rate</th>
                <th>Login Username</th>
                <th>Login Email</th>
                <th>Login Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const loginUser = clientUsers.find((u) => u.clientId === client.id);
                return (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.client_code}</td>
                    <td>${client.hourly_rate || 0}</td>
                    <td>{loginUser?.username || "Not created"}</td>
                    <td>{loginUser?.email || "-"}</td>
                    <td>{loginUser ? (loginUser.is_active ? "Active" : "Inactive") : "Missing"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {clients.length === 0 ? <p>No clients found.</p> : null}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

export default Clients;
