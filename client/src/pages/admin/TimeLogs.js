import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  generateInvoices,
  getCurrentUser,
  getPendingTimesheets,
  getTimesheetSummary,
  reviewTimesheet,
} from "../../services/auth";
import { downloadCsv } from "../../utils/export";

function TimeLogs() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [summary, setSummary] = useState({ totals: {}, workload: [], daily: [] });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    const [currentUser, pendingLogs, summaryData] = await Promise.all([
      getCurrentUser(),
      getPendingTimesheets(),
      getTimesheetSummary(),
    ]);

    if (currentUser.role !== "Admin") {
      throw new Error("Only Admin can access time logs");
    }

    setUser(currentUser);
    setPendingTimesheets(pendingLogs || []);
    setSummary(summaryData || { totals: {}, workload: [], daily: [] });
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadData();
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load time logs");
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

  const handleReviewTimesheet = async (id, approval_status) => {
    setError("");
    setSuccess("");
    try {
      await reviewTimesheet(id, { approval_status });
      await loadData();
      setSuccess("Time log review updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to review time log");
    }
  };

  const handleInvoiceUpdateFromApprovals = async () => {
    setError("");
    setSuccess("");
    try {
      const result = await generateInvoices();
      setSuccess(result.message || "Invoice updated from approved logs");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update invoice from approvals");
    }
  };

  const handleDownloadWorkloadReport = () => {
    if (!summary) return;

    const rows = [
      ...(summary.workload || []).map((entry) => ({
        section: "Workload",
        employeeName: entry.employeeName,
        username: entry.username,
        totalHours: entry.totalHours,
        approvedHours: entry.approvedHours,
        pendingHours: entry.pendingHours,
        billableHours: entry.billableHours,
        utilization: entry.utilization,
        workloadState: entry.workloadState,
      })),
      ...(summary.daily || []).map((entry) => ({
        section: "Daily Summary",
        date: entry.date,
        totalHours: entry.totalHours,
        approvedHours: entry.approvedHours,
        pendingHours: entry.pendingHours,
        billableHours: entry.billableHours,
        nonBillableHours: entry.nonBillableHours,
        breakHours: entry.breakHours,
      })),
    ];

    downloadCsv("time-logs-summary.csv", rows);
  };

  const handleDownloadPendingLogs = () => {
    if (!pendingTimesheets.length) return;

    downloadCsv(
      "pending-time-logs.csv",
      pendingTimesheets.map((entry) => ({
        taskId: entry.Task?.task_id || "-",
        taskDescription: entry.Task?.description || "-",
        employeeName: entry.Employee?.name || "-",
        username: entry.Employee?.username || "-",
        client: entry.Task?.Client?.name || "-",
        startTime: entry.start_time ? new Date(entry.start_time).toLocaleString() : "-",
        endTime: entry.end_time ? new Date(entry.end_time).toLocaleString() : "Running",
        hoursSpent: entry.hours_spent || 0,
        billableType: entry.billable_type || "-",
        approvalStatus: entry.approval_status || "-",
      }))
    );
  };

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading time logs...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role="Admin"
      title="Time Logs"
      subtitle={`Review employee logs before invoicing${user?.name ? ` | ${user.name}` : ""}`}
      onLogout={handleLogout}
      activeSection="Time Logs"
    >
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <section className="stat-grid premium-stats">
        <article className="stat-card">
          <h3>Pending Logs</h3>
          <p>{pendingTimesheets.length}</p>
        </article>
        <article className="stat-card">
          <h3>Employees Waiting</h3>
          <p>{new Set(pendingTimesheets.map((entry) => entry.Employee?.id).filter(Boolean)).size}</p>
        </article>
        <article className="stat-card">
          <h3>Pending Hours</h3>
          <p>
            {pendingTimesheets
              .reduce((total, entry) => total + Number(entry.hours_spent || 0), 0)
              .toFixed(2)}
          </p>
        </article>
        <article className="stat-card">
          <h3>Billable Hours</h3>
          <p>{summary.totals?.billableHours || 0}</p>
        </article>
      </section>

      <section className="admin-grid premium-grid">
        <article className="panel-card">
          <div className="panel-head">
            <h2>Workload Overview</h2>
            <div className="action-row">
              <span className="badge">{summary.workload?.length || 0} Members</span>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleDownloadWorkloadReport}
              >
                Download Summary
              </button>
            </div>
          </div>
          <div className="list-wrap">
            {(summary.workload || []).map((entry) => (
              <div className="list-item polished-item" key={entry.employeeId}>
                <span>
                  <strong>{entry.employeeName}</strong> ({entry.username || "user"})
                  <br />
                  {entry.totalHours}h logged | {entry.billableHours}h billable
                  <br />
                  Pending: {entry.pendingHours}h | Approved: {entry.approvedHours}h
                </span>
                <span className={`status-chip ${entry.workloadState === "Overloaded" ? "active" : entry.workloadState === "Balanced" ? "in-progress" : "completed"}`}>
                  {entry.workloadState} · {entry.utilization}%
                </span>
              </div>
            ))}
            {(summary.workload || []).length === 0 ? <p>No workload data yet.</p> : null}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h2>Daily Time Calendar</h2>
            <span className="badge">{summary.daily?.length || 0} Days</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Billable</th>
                  <th>Non-billable</th>
                </tr>
              </thead>
              <tbody>
                {(summary.daily || []).slice(-10).reverse().map((entry) => (
                  <tr key={entry.date}>
                    <td>{entry.date}</td>
                    <td>{entry.totalHours}h</td>
                    <td>{entry.approvedHours}h</td>
                    <td>{entry.pendingHours}h</td>
                    <td>{entry.billableHours}h</td>
                    <td>{entry.nonBillableHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(summary.daily || []).length === 0 ? <p>No time entries logged yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>Pending Time Logs</h2>
          <div className="action-row">
            <span className="badge">{pendingTimesheets.length} Pending</span>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleDownloadPendingLogs}
              disabled={!pendingTimesheets.length}
            >
              Download Pending Logs
            </button>
            <button type="button" onClick={handleInvoiceUpdateFromApprovals}>
              Update Invoice
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/admin/invoices")}
            >
              Open Invoices
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Employee</th>
                <th>Client</th>
                <th>Start</th>
                <th>End</th>
                <th>Hours</th>
                <th>Billable</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingTimesheets.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <strong>{entry.Task?.task_id || "-"}</strong>
                    <br />
                    {entry.Task?.description || "-"}
                  </td>
                  <td>
                    {entry.Employee?.name || "-"}
                    <br />
                    {entry.Employee?.username || "-"}
                  </td>
                  <td>{entry.Task?.Client?.name || "-"}</td>
                  <td>{entry.start_time ? new Date(entry.start_time).toLocaleString() : "-"}</td>
                  <td>{entry.end_time ? new Date(entry.end_time).toLocaleString() : "Running"}</td>
                  <td>{entry.hours_spent || 0}</td>
                  <td>{entry.billable_type}</td>
                  <td>{entry.approval_status}</td>
                  <td>
                    <div className="action-row">
                      <button type="button" onClick={() => handleReviewTimesheet(entry.id, "Approved")}>
                        Approve
                      </button>
                      <button type="button" onClick={() => handleReviewTimesheet(entry.id, "Rejected")}>
                        Reject
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleReviewTimesheet(entry.id, "Correction Requested")}
                      >
                        Correction
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingTimesheets.length === 0 ? <p>No pending time logs.</p> : null}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

export default TimeLogs;
