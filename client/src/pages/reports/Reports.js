import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  getCurrentUser,
  getProjectReport,
  getReportsSummary,
  getTimesheetReport,
} from "../../services/auth";
import { downloadCsv } from "../../utils/export";

function Reports() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [timesheetReport, setTimesheetReport] = useState(null);
  const [projectReport, setProjectReport] = useState([]);
  const [activeTab, setActiveTab] = useState("summary");
  const [filters, setFilters] = useState({ startDate: "", endDate: "", employeeId: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const loadAll = async () => {
    const [currentUser, summaryData, tsReport, projReport] = await Promise.all([
      getCurrentUser(),
      getReportsSummary(),
      getTimesheetReport(),
      getProjectReport(),
    ]);
    setUser(currentUser);
    setSummary(summaryData);
    setTimesheetReport(tsReport);
    setProjectReport(projReport || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadAll();
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load reports");
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

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyFilters = async () => {
    setIsFiltering(true);
    setError("");
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.employeeId) params.employeeId = filters.employeeId;
      const data = await getTimesheetReport(params);
      setTimesheetReport(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply filters");
    } finally {
      setIsFiltering(false);
    }
  };

  const handleClearFilters = async () => {
    setFilters({ startDate: "", endDate: "", employeeId: "" });
    setIsFiltering(true);
    try {
      const data = await getTimesheetReport();
      setTimesheetReport(data);
    } catch (err) {
      setError("Failed to reset filters");
    } finally {
      setIsFiltering(false);
    }
  };

  const handleDownloadSummary = () => {
    if (!summary) return;

    downloadCsv("reports-summary.csv", [
      {
        section: "Timesheets",
        totalTimesheets: summary.timesheets?.total ?? 0,
        approvedTimesheets: summary.timesheets?.approved ?? 0,
        pendingTimesheets: summary.timesheets?.pending ?? 0,
        totalApprovedHours: summary.timesheets?.totalApprovedHours ?? 0,
        billableHours: summary.timesheets?.billableHours ?? 0,
        totalIssues: summary.issues?.total ?? 0,
        openIssues: summary.issues?.open ?? 0,
        resolvedIssues: summary.issues?.resolved ?? 0,
        closedIssues: summary.issues?.closed ?? 0,
        totalInvoices: summary.invoices?.total ?? 0,
        paidInvoices: summary.invoices?.paid ?? 0,
        unpaidInvoices: summary.invoices?.unpaid ?? 0,
      },
    ]);
  };

  const handleDownloadTimesheetReport = () => {
    if (!timesheetReport) return;

    const rows = [
      {
        section: "Summary",
        name: "Approved Timesheet Report",
        totalHours: timesheetReport.summary?.totalHours ?? 0,
        billableHours: timesheetReport.summary?.billableHours ?? 0,
        nonBillableHours: timesheetReport.summary?.nonBillableHours ?? 0,
        totalEntries: timesheetReport.summary?.totalEntries ?? 0,
      },
      ...(timesheetReport.byEmployee || []).map((emp) => ({
        section: "By Employee",
        name: emp.employeeName,
        username: emp.username,
        totalHours: emp.totalHours,
        billableHours: emp.billableHours,
        entries: emp.entries,
      })),
      ...(timesheetReport.byProject || []).map((proj) => ({
        section: "By Project",
        name: proj.projectTitle,
        projectCode: proj.projectCode,
        totalHours: proj.totalHours,
        billableHours: proj.billableHours,
      })),
    ];

    downloadCsv("timesheet-report.csv", rows);
  };

  const handleDownloadProjectReport = () => {
    if (!projectReport.length) return;

    downloadCsv(
      "project-report.csv",
      projectReport.map((proj) => ({
        projectCode: proj.project_code,
        projectTitle: proj.project_title,
        client: proj.client?.name || "-",
        status: proj.status,
        totalTasks: proj.totalTasks,
        completed: proj.statusCounts?.Completed ?? 0,
        inProgress: proj.statusCounts?.["In Progress"] ?? 0,
        notStarted: proj.statusCounts?.["Not Started"] ?? 0,
        waitingForClient: proj.statusCounts?.["Waiting for Client"] ?? 0,
        completionPct: proj.completionPct,
        estimatedHours: proj.estimatedHours,
      }))
    );
  };

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading reports...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role={user?.role}
      title="Reports"
      subtitle={`Analytics and insights${user?.name ? ` | ${user.name}` : ""}`}
      onLogout={handleLogout}
      activeSection="Reports"
    >
      {error ? <p className="error-text">{error}</p> : null}

      {/* Tab Navigation */}
      <div className="action-row" style={{ marginBottom: "1.5rem" }}>
        {["summary", "timesheets", "projects"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "" : "secondary-btn"}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: "capitalize" }}
          >
            {tab === "timesheets" ? "Time Reports" : tab === "projects" ? "Project Reports" : "Summary"}
          </button>
        ))}
      </div>

      {/* SUMMARY TAB */}
      {activeTab === "summary" && summary && (
        <>
          <div className="action-row" style={{ marginBottom: "1rem" }}>
            <button type="button" onClick={handleDownloadSummary}>
              Download Summary
            </button>
          </div>
          <section className="stat-grid premium-stats">
            <article className="stat-card">
              <h3>Total Approved Hours</h3>
              <p>{summary.timesheets?.totalApprovedHours ?? 0}h</p>
            </article>
            <article className="stat-card">
              <h3>Billable Hours</h3>
              <p>{summary.timesheets?.billableHours ?? 0}h</p>
            </article>
            <article className="stat-card">
              <h3>Pending Logs</h3>
              <p>{summary.timesheets?.pending ?? 0}</p>
            </article>
            <article className="stat-card">
              <h3>Total Timesheets</h3>
              <p>{summary.timesheets?.total ?? 0}</p>
            </article>
          </section>

          <section className="admin-grid premium-grid" style={{ marginTop: "1.5rem" }}>
            <article className="panel-card">
              <div className="panel-head">
                <h2>Issue Overview</h2>
                <span className="badge">{summary.issues?.total ?? 0} Total</span>
              </div>
              <div className="list-wrap">
                {[
                  { label: "Open", value: summary.issues?.open ?? 0, cls: "active" },
                  { label: "Resolved", value: summary.issues?.resolved ?? 0, cls: "completed" },
                  { label: "Closed", value: summary.issues?.closed ?? 0, cls: "" },
                ].map((row) => (
                  <div className="list-item polished-item" key={row.label}>
                    <span>{row.label}</span>
                    <span className={`status-chip ${row.cls}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel-card">
              <div className="panel-head">
                <h2>Invoice Overview</h2>
                <span className="badge">{summary.invoices?.total ?? 0} Total</span>
              </div>
              <div className="list-wrap">
                {[
                  { label: "Paid", value: summary.invoices?.paid ?? 0, cls: "completed" },
                  { label: "Unpaid", value: summary.invoices?.unpaid ?? 0, cls: "active" },
                ].map((row) => (
                  <div className="list-item polished-item" key={row.label}>
                    <span>{row.label}</span>
                    <span className={`status-chip ${row.cls}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      )}

      {/* TIMESHEET REPORT TAB */}
      {activeTab === "timesheets" && (
        <>
          {/* Filters */}
          <section className="panel-card" style={{ marginBottom: "1.5rem" }}>
            <div className="panel-head">
              <h2>Filters</h2>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleDownloadTimesheetReport}
                disabled={!timesheetReport}
              >
                Download Time Report
              </button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
              </div>
            </div>
            <div className="action-row" style={{ marginTop: "0.75rem" }}>
              <button type="button" onClick={handleApplyFilters} disabled={isFiltering}>
                {isFiltering ? "Applying..." : "Apply Filters"}
              </button>
              <button type="button" className="secondary-btn" onClick={handleClearFilters} disabled={isFiltering}>
                Clear
              </button>
            </div>
          </section>

          {timesheetReport && (
            <>
              {/* Summary cards */}
              <section className="stat-grid premium-stats" style={{ marginBottom: "1.5rem" }}>
                <article className="stat-card">
                  <h3>Total Hours</h3>
                  <p>{timesheetReport.summary?.totalHours ?? 0}h</p>
                </article>
                <article className="stat-card">
                  <h3>Billable Hours</h3>
                  <p>{timesheetReport.summary?.billableHours ?? 0}h</p>
                </article>
                <article className="stat-card">
                  <h3>Non-Billable</h3>
                  <p>{timesheetReport.summary?.nonBillableHours ?? 0}h</p>
                </article>
                <article className="stat-card">
                  <h3>Log Entries</h3>
                  <p>{timesheetReport.summary?.totalEntries ?? 0}</p>
                </article>
              </section>

              <section className="admin-grid premium-grid">
                {/* By Employee */}
                <article className="panel-card">
                  <div className="panel-head">
                    <h2>By Employee</h2>
                    <span className="badge">{timesheetReport.byEmployee?.length ?? 0} Members</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Total Hours</th>
                          <th>Billable</th>
                          <th>Entries</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(timesheetReport.byEmployee || []).map((emp) => (
                          <tr key={emp.employeeId}>
                            <td>
                              <strong>{emp.employeeName}</strong>
                              <br />
                              <small>{emp.username}</small>
                            </td>
                            <td>{emp.totalHours}h</td>
                            <td>{emp.billableHours}h</td>
                            <td>{emp.entries}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(timesheetReport.byEmployee || []).length === 0 && <p>No data for selected filters.</p>}
                  </div>
                </article>

                {/* By Project */}
                <article className="panel-card">
                  <div className="panel-head">
                    <h2>By Project</h2>
                    <span className="badge">{timesheetReport.byProject?.length ?? 0} Projects</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Project</th>
                          <th>Total Hours</th>
                          <th>Billable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(timesheetReport.byProject || []).map((proj, i) => (
                          <tr key={proj.projectId || i}>
                            <td>
                              <strong>{proj.projectTitle}</strong>
                              {proj.projectCode !== "—" && <><br /><small>{proj.projectCode}</small></>}
                            </td>
                            <td>{proj.totalHours}h</td>
                            <td>{proj.billableHours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(timesheetReport.byProject || []).length === 0 && <p>No data for selected filters.</p>}
                  </div>
                </article>
              </section>
            </>
          )}
        </>
      )}

      {/* PROJECT REPORT TAB */}
      {activeTab === "projects" && (
        <section className="panel-card full-span">
          <div className="panel-head">
            <h2>Project Status Report</h2>
            <div className="action-row">
              <span className="badge">{projectReport.length} Projects</span>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleDownloadProjectReport}
                disabled={!projectReport.length}
              >
                Download Project Report
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Total Tasks</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>Not Started</th>
                  <th>Completion</th>
                  <th>Est. Hours</th>
                </tr>
              </thead>
              <tbody>
                {projectReport.map((proj) => (
                  <tr key={proj.id}>
                    <td>
                      <strong>{proj.project_title}</strong>
                      <br />
                      <small>{proj.project_code}</small>
                    </td>
                    <td>{proj.client?.name || "—"}</td>
                    <td>
                      <span className={`status-chip ${proj.status === "Completed" ? "completed" : proj.status === "In Progress" ? "in-progress" : "active"}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td>{proj.totalTasks}</td>
                    <td>{proj.statusCounts?.Completed ?? 0}</td>
                    <td>{proj.statusCounts?.["In Progress"] ?? 0}</td>
                    <td>{proj.statusCounts?.["Not Started"] ?? 0}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "60px", height: "6px", background: "#eee", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ width: `${proj.completionPct}%`, height: "100%", background: "#4caf50" }} />
                        </div>
                        <span>{proj.completionPct}%</span>
                      </div>
                    </td>
                    <td>{proj.estimatedHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {projectReport.length === 0 && <p>No projects found.</p>}
          </div>
        </section>
      )}
    </WorkspaceLayout>
  );
}

export default Reports;
