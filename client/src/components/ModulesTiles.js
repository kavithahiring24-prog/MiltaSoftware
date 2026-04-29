import { useNavigate } from "react-router-dom";

const ICON = {
  Home:          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Dashboard:     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Projects:      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  "Task Board":  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>,
  "Task Lists":  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Milestones:    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  Issues:        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Reports:       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  "Time Logs":   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Clients:       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Organizations: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Employees:     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  Categories:    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Roles:         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Invoices:      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Tasks:         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  Profile:       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

const TILE_CATEGORIES = {
  OVERVIEW: { color: "#0066cc", bgColor: "#f0f5ff" },
  WORK: { color: "#219653", bgColor: "#f0fdf4" },
  TRACK: { color: "#eb5757", bgColor: "#fff5f5" },
  MANAGE: { color: "#ff7700", bgColor: "#fff8f0" },
  BILLING: { color: "#7c5cdb", bgColor: "#faf8ff" },
  SYSTEM: { color: "#888888", bgColor: "#f9f9f9" },
};

const ROUTE = {
  Home:          "/home",
  Projects:      "/projects",
  "Task Board":  "/manager/tasks",
  "Task Lists":  "/task-lists",
  Milestones:    "/milestones",
  Issues:        "/issues",
  Reports:       "/reports",
  "Time Logs":   "/admin/time-logs",
  Clients:       "/admin/clients",
  Organizations: "/admin/organizations",
  Employees:     "/settings?tab=portal-users",
  Categories:    "/settings?tab=task-timesheet",
  Roles:         "/admin/roles",
  Invoices:      "/admin/invoices",
  Notifications: "/notifications",
  Settings:      "/settings",
  Tasks:         "/employee/tasks",
  Profile:       "/profile",
  Dashboard:     null,
};

function getRoute(section, role) {
  if (section === "Home" || section === "Dashboard") {
    if (role === "Admin") return "/admin/dashboard";
    if (role === "Manager") return "/manager/dashboard";
    if (role === "Employee") return "/employee/dashboard";
    if (role === "Client") return "/client/dashboard";
  }
  if (section === "Invoices") return role === "Client" ? "/client/dashboard" : "/admin/invoices";
  return ROUTE[section] || "/home";
}

const NAV_GROUPS = {
  Admin: [
    { label: "OVERVIEW",  items: ["Dashboard"] },
    { label: "WORK",      items: ["Projects", "Task Board", "Task Lists", "Milestones"] },
    { label: "TRACK",     items: ["Issues", "Reports", "Time Logs"] },
    { label: "MANAGE",    items: ["Clients", "Organizations", "Employees", "Categories", "Roles", "Invoices"] },
    { label: "SYSTEM",    items: ["Settings"] },
  ],
  Manager: [
    { label: "OVERVIEW",  items: ["Dashboard"] },
    { label: "WORK",      items: ["Projects", "Task Board", "Task Lists", "Milestones"] },
    { label: "TRACK",     items: ["Issues", "Reports"] },
    { label: "SYSTEM",    items: ["Notifications", "Profile"] },
  ],
  Employee: [
    { label: "OVERVIEW",  items: ["Dashboard"] },
    { label: "WORK",      items: ["Tasks", "Milestones"] },
    { label: "TRACK",     items: ["Issues"] },
    { label: "SYSTEM",    items: ["Notifications", "Profile"] },
  ],
  Client: [
    { label: "OVERVIEW",  items: ["Dashboard"] },
    { label: "BILLING",   items: ["Invoices"] },
    { label: "SYSTEM",    items: ["Notifications", "Profile"] },
  ],
};

function ModulesTile({ title, icon, count, category, onClick }) {
  const categoryColor = TILE_CATEGORIES[category];
  
  return (
    <div
      className="module-tile"
      style={{
        borderTop: `4px solid ${categoryColor.color}`,
        backgroundColor: categoryColor.bgColor,
      }}
      onClick={onClick}
    >
      <div className="tile-icon" style={{ color: categoryColor.color }}>
        {icon}
      </div>
      <h3 className="tile-title">{title}</h3>
      {count !== undefined && (
        <p className="tile-count">
          <span className="count-number">{count}</span>
          <span className="count-label">items</span>
        </p>
      )}
    </div>
  );
}

export default function ModulesTiles({ role = "Employee", stats = {} }) {
  const navigate = useNavigate();
  const groups = NAV_GROUPS[role] || NAV_GROUPS.Employee;

  const handleTileClick = (section) => {
    const route = getRoute(section, role);
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="modules-container">
      {groups.map((group) => (
        <div key={group.label} className="modules-group">
          <h2 className="group-title">{group.label}</h2>
          <div className="tiles-grid">
            {group.items.map((item) => (
              <ModulesTile
                key={item}
                title={item}
                icon={ICON[item]}
                count={stats[item] || 0}
                category={group.label}
                onClick={() => handleTileClick(item)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
