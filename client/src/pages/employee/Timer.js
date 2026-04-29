import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuth,
  getCurrentUser,
  getMyTasks,
  getMyTimesheets,
  getTimesheetSummary,
  updateTaskStatus,
} from "../../services/auth";
import WorkspaceLayout from "../../components/WorkspaceLayout";

function Timer() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ totals: {}, workload: [], daily: [] });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [statusInputs, setStatusInputs] = useState({});
  const [noteInputs, setNoteInputs] = useState({});

  const loadData = async () => {
    const [currentUser, myTasks, myLogs, summaryData] = await Promise.all([
      getCurrentUser(),
      getMyTasks(),
      getMyTimesheets(),
      getTimesheetSummary(),
    ]);

    if (!currentUser || !["Employee", "Manager", "Admin"].includes(currentUser.role)) {
      throw new Error("Only Employee/Manager/Admin can access this page");
    }

    setUser(currentUser);
    setTasks(myTasks);
    setLogs(myLogs);
    setSummary(summaryData || { totals: {}, workload: [], daily: [] });
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadData();
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load employee dashboard");
        clearAuth();
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [navigate]);

  const getTaskTotalHours = (taskId) => {
    let total = 0;
    logs.forEach((log) => {
      if (log.taskId !== taskId) return;
      total += Number(log.hours_spent || 0);
    });
    return Number(total.toFixed(2));
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleStatusUpdate = async (taskId) => {
    setError("");
    setSuccess("");
    try {
      await updateTaskStatus(taskId, {
        status: statusInputs[taskId] || "In Progress",
        notes: noteInputs[taskId] || "",
      });
      await loadData();
      setSuccess("Task progress updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading employee dashboard...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role={user?.role || "Employee"}
      title="My Tasks"
      subtitle={`Logged in as ${user?.name} (${user?.role})`}
      onLogout={handleLogout}
      activeSection="Tasks"
    >
      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <section className="stat-grid premium-stats">
        <article className="stat-card">
          <h3>Total Logged</h3>
          <p>{summary.totals?.hours || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Billable</h3>
          <p>{summary.totals?.billableHours || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Non-billable</h3>
          <p>{summary.totals?.nonBillableHours || 0}</p>
        </article>
        <article className="stat-card">
          <h3>Entries</h3>
          <p>{summary.totals?.entries || 0}</p>
        </article>
      </section>

      <section className="admin-grid single-column">
        <article className="panel-card">
          <div className="panel-head">
            <h2>My Weekly Capacity</h2>
            <span className="badge">
              {summary.workload?.[0]?.utilization || 0}% Utilized
            </span>
          </div>
          <p>
            Logged {summary.workload?.[0]?.totalHours || 0}h out of {summary.workload?.[0]?.capacityHours || 40}h
            planned capacity. Current state: {summary.workload?.[0]?.workloadState || "Available"}.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Billable</th>
                </tr>
              </thead>
              <tbody>
                {(summary.daily || []).slice(-7).reverse().map((entry) => (
                  <tr key={entry.date}>
                    <td>{entry.date}</td>
                    <td>{entry.totalHours}h</td>
                    <td>{entry.approvedHours}h</td>
                    <td>{entry.pendingHours}h</td>
                    <td>{entry.billableHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(summary.daily || []).length === 0 ? <p>No daily logs yet.</p> : null}
          </div>
        </article>

        <article className="panel-card">
          <h2>My Assigned Tasks</h2>
          <div className="list-wrap large-list">
            {tasks.map((task) => {
              const canEditTask = task.Manager?.id === user?.id;
              return (
                <div key={task.id} className="list-item task-item">
                  <span>
                    <strong>{task.task_id}</strong> - {task.task_name || task.description}
                    <br />
                    Client: {task.Client?.name} | Category: {task.Category?.name}
                    <br />
                    Status: {task.status} | Due: {task.due_date}
                    <br />
                    Total Time: {getTaskTotalHours(task.id)}h
                    <br />
                    Created By: {task.Manager?.name || "-"}
                  </span>

                  <div className="task-actions">
                    <select
                      value={statusInputs[task.id] || task.status}
                      disabled={!canEditTask}
                      onChange={(e) =>
                        setStatusInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                      }
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>Waiting for Client</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Add notes"
                      disabled={!canEditTask}
                      value={noteInputs[task.id] || ""}
                      onChange={(e) =>
                        setNoteInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                      }
                    />

                    <button type="button" onClick={() => handleStatusUpdate(task.id)} disabled={!canEditTask}>
                      {canEditTask ? "Update Status" : "Creator Only"}
                    </button>
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 ? <p>No tasks assigned yet.</p> : null}
          </div>
        </article>

        <article className="panel-card">
          <h2>My Timesheet Logs</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Task Name</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Hours</th>
                  <th>Billable</th>
                  <th>Approval</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.Task?.task_id}</td>
                    <td>{log.Task?.task_name || log.Task?.description}</td>
                    <td>{new Date(log.start_time).toLocaleString()}</td>
                    <td>{log.end_time ? new Date(log.end_time).toLocaleString() : "Running"}</td>
                    <td>{log.hours_spent}</td>
                    <td>{log.billable_type}</td>
                    <td>{log.approval_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 ? <p>No logs yet.</p> : null}
          </div>
        </article>
      </section>
    </WorkspaceLayout>
  );
}

export default Timer;
