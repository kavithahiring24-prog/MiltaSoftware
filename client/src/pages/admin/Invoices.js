import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  generateInvoices,
  getAdminInvoices,
  getCurrentUser,
  getInvoicePreview,
} from "../../services/auth";

function Invoices() {
  const navigate = useNavigate();
  const [data, setData] = useState({ summary: null, clients: [] });
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadPreview = async () => {
    const [currentUser, preview, generated] = await Promise.all([
      getCurrentUser(),
      getInvoicePreview(),
      getAdminInvoices(),
    ]);
    if (currentUser.role !== "Admin") {
      throw new Error("Only Admin can access invoices");
    }
    setData(preview);
    setInvoices(generated || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadPreview();
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load invoices");
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

  const handleGenerateInvoices = async () => {
    setError("");
    setSuccess("");
    try {
      const result = await generateInvoices();
      setSuccess(result.message || "Invoices generated");
      await loadPreview();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate invoices");
    }
  };

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading invoices...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role="Admin"
      title="Invoices"
      subtitle={`Amount = Approved Hours x Hourly Rate (USD & INR)${data.summary?.usdInrRate ? ` | 1 USD = ${data.summary.usdInrRate} INR` : ""}`}
      onLogout={handleLogout}
      activeSection="Invoices"
    >
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <section className="stat-grid premium-stats">
        <article className="stat-card">
          <h3>Clients</h3>
          <p>{data.summary?.totalClients || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Approved Hours</h3>
          <p>{data.summary?.totalApprovedHours || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Total Amount (USD)</h3>
          <p>${data.summary?.totalAmountUsd || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Total Amount (INR)</h3>
          <p>Rs. {data.summary?.totalAmountInr || 0}</p>
        </article>
      </section>

      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>Client Invoice Calculation</h2>
          <div className="action-row">
            <span className="badge">Auto Calculated</span>
            <button type="button" onClick={handleGenerateInvoices}>
              Generate Invoice
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Code</th>
                <th>Hourly Rate (USD)</th>
                <th>Hourly Rate (INR)</th>
                <th>Approved Hours</th>
                <th>Amount (USD)</th>
                <th>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              {(data.clients || []).map((item) => (
                <tr key={item.clientId}>
                  <td>{item.clientName}</td>
                  <td>{item.clientCode}</td>
                  <td>${item.hourlyRate}</td>
                  <td>Rs. {item.hourlyRateInr}</td>
                  <td>{item.approvedHours}</td>
                  <td>${item.amountUsd}</td>
                  <td>Rs. {item.amountInr}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data.clients || []).length === 0 ? <p>No approved logs yet for invoice calculation.</p> : null}
        </div>
      </section>

      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>Generated Invoices</h2>
          <span className="badge">{invoices.length} Records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Hours</th>
                <th>Rate USD</th>
                <th>Amount USD</th>
                <th>Amount INR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoice_number}</td>
                  <td>{inv.Client?.name || "-"}</td>
                  <td>{inv.total_hours}</td>
                  <td>${inv.hourly_rate_usd}</td>
                  <td>${inv.total_amount_usd}</td>
                  <td>Rs. {inv.total_amount_inr}</td>
                  <td>{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 ? <p>No invoices generated yet. Click Generate Invoice.</p> : null}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

export default Invoices;
