import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  getClientPortalDashboard,
  getCurrentUser,
  payClientInvoice,
} from "../../services/auth";

const STATUS_COLOR = { Pending: "#f59e0b", Paid: "#10b981", Overdue: "#ef4444" };
const STATUS_BG    = { Pending: "#fffbeb", Paid:   "#f0fdf4", Overdue: "#fef2f2" };

function ClientDashboard() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [clientData, setClientData] = useState(null);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Invoices");

  const loadData = async () => {
    const [currentUser, portal] = await Promise.all([getCurrentUser(), getClientPortalDashboard()]);
    if (currentUser.role !== "Client") throw new Error("Client access only");
    setUser(currentUser);
    setClientData(portal);
  };

  useEffect(() => {
    const load = async () => {
      try { await loadData(); }
      catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard");
        clearAuth();
        navigate("/login", { replace: true });
      } finally { setIsLoading(false); }
    };
    load();
  }, [navigate]);

  const handleLogout = () => { clearAuth(); navigate("/login", { replace: true }); };

  const handlePayNow = async (invoiceId) => {
    setError(""); setSuccess("");
    try {
      await payClientInvoice(invoiceId);
      setSuccess("Payment completed successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process payment");
    }
  };

  if (isLoading) {
    return <main className="auth-layout"><section className="auth-card"><h2>Loading dashboard...</h2></section></main>;
  }

  const invoices    = clientData?.invoices    || [];
  const taskSummary = clientData?.taskSummary || [];
  const entries     = clientData?.entries     || [];
  const summary     = clientData?.summary     || {};
  const pendingCount = invoices.filter((i) => i.status === "Pending").length;

  return (
    <WorkspaceLayout
      role="Client"
      title="Client Portal"
      subtitle={`${user?.name} · ${clientData?.client?.name || "My Account"}`}
      onLogout={handleLogout}
      activeSection="Dashboard"
    >
      {error   && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      {/* Hero */}
      <div className="admin-hero" style={{ marginBottom: "14px" }}>
        <div className="admin-hero-main">
          <h2>{clientData?.client?.name || "Client Portal"}</h2>
          <p>
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
            {summary.totalHours || 0} approved hours &nbsp;·&nbsp;
            ${summary.estimatedAmount || 0} total
          </p>
        </div>
        <div className="admin-hero-meta">
          {pendingCount > 0 && <span className="status-pill">{pendingCount} Pending</span>}
          <span className="status-pill subtle">{clientData?.client?.client_code || "CLIENT"}</span>
        </div>
      </div>

      {/* KPI tiles */}
      <section className="stat-grid premium-stats">
        <article className="stat-card">
          <h3>Approved Hours</h3>
          <p>{summary.totalHours || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Hourly Rate</h3>
          <p>${summary.hourlyRate || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Total (USD)</h3>
          <p>${summary.estimatedAmount || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Pending (INR)</h3>
          <p>₹{summary.pendingInr || 0}</p>
        </article>
      </section>

      {/* Tabs */}
      <section className="project-tabs" style={{ marginBottom: "10px" }}>
        {["Invoices", "Task Summary", "Timesheet Entries"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Invoices" && pendingCount > 0 && (
              <span style={{ marginLeft: 6, background: "#fde68a", color: "#92400e", borderRadius: 999, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </section>

      {/* ── Invoices tab ─────────────────────── */}
      {activeTab === "Invoices" && (
        <div className="project-tiles-grid">
          {invoices.map((inv) => {
            const color = STATUS_COLOR[inv.status] || "#64748b";
            const bg    = STATUS_BG[inv.status]    || "#f8fafc";
            return (
              <div className="project-tile" key={inv.id}>
                <div className="project-tile-accent" style={{ background: color }} />
                <div className="project-tile-body">
                  <div className="project-tile-top">
                    <span className="project-tile-code">{inv.invoice_number}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, border: `1px solid ${color}30`, borderRadius: 999, padding: "3px 9px" }}>
                      {inv.status}
                    </span>
                  </div>
                  <h3 className="project-tile-name">Invoice {inv.invoice_number}</h3>
                  <p className="project-tile-owner">{inv.total_hours}h @ ${inv.hourly_rate_usd}/hr</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "10px 0" }}>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>USD</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>${inv.total_amount_usd}</div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>INR</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>₹{inv.total_amount_inr}</div>
                    </div>
                  </div>

                  <div className="project-tile-footer">
                    <span className="project-tile-meta-item" style={{ fontSize: 11, color: "#64748b" }}>
                      {inv.paid_at ? `Paid ${new Date(inv.paid_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}` : "Awaiting payment"}
                    </span>
                    {inv.status === "Pending" && (
                      <button
                        type="button"
                        style={{ margin: 0, padding: "6px 14px", fontSize: 12, background: "linear-gradient(135deg,#0066cc,#0052a3)", borderRadius: 7 }}
                        onClick={() => handlePayNow(inv.id)}
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {invoices.length === 0 && (
            <div className="project-tile-empty">
              <p>No invoices yet</p>
              <p>Invoices will appear here once generated by your account manager.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Task Summary tab ─────────────────── */}
      {activeTab === "Task Summary" && (
        <div className="project-tiles-grid">
          {taskSummary.map((item, idx) => {
            const colors = ["#0b66e4","#6366f1","#10b981","#f59e0b","#ec4899","#06b6d4"];
            const color  = colors[idx % colors.length];
            return (
              <div className="project-tile" key={item.taskId}>
                <div className="project-tile-accent" style={{ background: color }} />
                <div className="project-tile-body">
                  <div className="project-tile-top">
                    <span className="project-tile-code">{item.taskId}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 999, padding: "3px 9px" }}>
                      Approved
                    </span>
                  </div>
                  <h3 className="project-tile-name">{item.taskName}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Hours</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{item.hours}</div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Amount</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>${item.amount}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {taskSummary.length === 0 && (
            <div className="project-tile-empty">
              <p>No approved task hours yet</p>
              <p>Approved timesheet entries will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Timesheet Entries tab ─────────────── */}
      {activeTab === "Timesheet Entries" && (
        <section className="panel-card full-span">
          <div className="panel-head">
            <h2>Approved Timesheet Entries</h2>
            <span className="badge">{entries.length} entries</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Task</th>
                  <th>Employee</th>
                  <th>Hours</th>
                  <th>Billable</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: 700, color: "#5a7fa8" }}>{entry.Task?.task_id}</td>
                    <td style={{ color: "#1e293b" }}>{entry.Task?.description}</td>
                    <td style={{ color: "#475569" }}>{entry.Employee?.name}</td>
                    <td style={{ fontWeight: 700 }}>{entry.hours_spent}h</td>
                    <td><span className="badge">{entry.billable_type}</span></td>
                    <td style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                      {new Date(entry.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                <p style={{ fontWeight: 700, color: "#475569", margin: "0 0 6px" }}>No entries yet</p>
                <p style={{ margin: 0, fontSize: 13 }}>Timesheet entries approved for your account will appear here.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </WorkspaceLayout>
  );
}

export default ClientDashboard;
