import { useEffect, useState } from "react";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import { clearAuth } from "../../services/auth";
import { useNavigate } from "react-router-dom";
import { getUtilizationReport } from "../../api";

function Utilization() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const responseData = await getUtilizationReport();
        setData(responseData);
      } catch (err) {
        setError("Failed to load utilization data");
        if (err.response?.status === 401) {
          clearAuth();
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <WorkspaceLayout title="Resource Utilization" onLogout={handleLogout} activeSection="Reports">
      <div className="utilization-container">
        <header className="utilization-header">
          <h1>Resource Utilization</h1>
          <p>Tracking capacity and workload across the team (Last 30 Days)</p>
        </header>

        {isLoading ? (
          <p>Loading utilization stats...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <div className="utilization-grid">
            {data.map((user) => (
              <div key={user.userId} className="panel-card utilization-card">
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <span>@{user.username}</span>
                </div>
                
                <div className="utilization-stats">
                  <div className="stat-item">
                    <label>Hours Logged</label>
                    <span className="value">{user.hoursLogged}h</span>
                  </div>
                  <div className="stat-item">
                    <label>Capacity</label>
                    <span className="value">{user.capacity}h</span>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-meta">
                    <span>Utilization</span>
                    <span>{user.utilization}%</span>
                  </div>
                  <div className="util-progress-track">
                    <div 
                      className={`util-progress-fill ${user.utilization > 100 ? "overloaded" : user.utilization > 80 ? "warning" : "optimal"}`}
                      style={{ width: `${Math.min(user.utilization, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}

export default Utilization;
