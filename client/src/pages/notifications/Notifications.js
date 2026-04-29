import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import {
  clearAuth,
  deleteNotificationById,
  getCurrentUser,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/auth";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Notifications() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    const [currentUser, data] = await Promise.all([getCurrentUser(), getMyNotifications()]);
    setUser(currentUser);
    setNotifications(data || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadData();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load notifications");
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

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update notification");
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update notifications");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotificationById(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete notification");
    }
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  if (isLoading) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading notifications...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role={user?.role}
      title="Notifications"
      subtitle={`Recent updates for ${user?.name || "your workspace"}`}
      onLogout={handleLogout}
      activeSection="Notifications"
    >
      <div className="admin-hero">
        <div className="admin-hero-main">
          <h2>Notifications</h2>
          <p>Stay on top of assignments, uploads, milestones, and reminders.</p>
        </div>
        <div className="admin-hero-meta">
          <span className="status-pill">{unreadCount} unread</span>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="panel-card full-span">
        <div className="panel-head">
          <h2>Inbox</h2>
          <button type="button" className="secondary-btn" onClick={handleMarkAll}>
            Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => (
              <article
                className={`notification-card ${notification.isRead ? "read" : "unread"}`}
                key={notification.id}
              >
                <div className="notification-copy">
                  <div className="notification-title-row">
                    <h3>{notification.title}</h3>
                    {!notification.isRead ? <span className="badge">New</span> : null}
                  </div>
                  <p>{notification.message || "No additional details."}</p>
                  <span>{formatDate(notification.createdAt)}</span>
                </div>
                <div className="notification-actions">
                  {!notification.isRead ? (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => handleDelete(notification.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </WorkspaceLayout>
  );
}

export default Notifications;
