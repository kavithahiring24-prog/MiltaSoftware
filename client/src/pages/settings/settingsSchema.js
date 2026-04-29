export const SETTINGS_NAV = [
  {
    id: "personal",
    label: "Personal",
    items: [
      { id: "personal-preferences", label: "Personal Preferences", roles: ["Admin", "Manager", "Employee", "Client"] },
      { id: "personal-settings", label: "Personal Settings", roles: ["Admin", "Manager", "Employee", "Client"] },
      { id: "notifications", label: "Notifications", roles: ["Admin", "Manager", "Employee", "Client"] },
      { id: "feed-notifications", label: "Feed Notifications", roles: ["Admin", "Manager", "Employee", "Client"] },
      { id: "personal-email", label: "Personal Email", roles: ["Admin", "Manager", "Employee", "Client"] },
      { id: "activity-reminder", label: "Activity Reminder", roles: ["Admin", "Manager", "Employee"] },
      { id: "schedule-export", label: "Schedule Export", roles: ["Admin", "Manager", "Employee", "Client"] },
    ],
  },
  {
    id: "portal-configuration",
    label: "Portal Configuration",
    items: [
      { id: "portal-configuration-main", label: "Configuration", roles: ["Admin"] },
      { id: "business-calendar", label: "Business Calendar", roles: ["Admin"] },
      { id: "project-budget", label: "Project & Budget", roles: ["Admin"] },
      { id: "task-timesheet", label: "Task & Timesheet", roles: ["Admin"] },
      { id: "portal-email-notifications", label: "Email Notifications", roles: ["Admin"] },
      { id: "ai-hub", label: "AI Hub", roles: ["Admin"] },
    ],
  },
  {
    id: "data-administration",
    label: "Data Administration",
    items: [
      { id: "storage", label: "Storage", roles: ["Admin"] },
      { id: "backup", label: "Backup", roles: ["Admin"] },
      { id: "recycle-bin", label: "Recycle Bin", roles: ["Admin"] },
      { id: "audit-log", label: "Audit Log", roles: ["Admin"] },
    ],
  },
  {
    id: "manage-users",
    label: "Manage Users",
    items: [
      { id: "portal-users", label: "Portal Users", roles: ["Admin"] },
      { id: "client-users", label: "Client Users", roles: ["Admin"] },
      { id: "teams", label: "Teams", roles: ["Admin"] },
      { id: "resources", label: "Resources", roles: ["Admin"] },
      { id: "invitation-templates", label: "Invitation Templates", roles: ["Admin"] },
      { id: "profiles", label: "Profiles", roles: ["Admin"] },
      { id: "roles", label: "Roles", roles: ["Admin"] },
    ],
  },
];

export const DEFAULT_SETTINGS = {
  theme: "System",
  language: "English",
  dateFormat: "DD MMM YYYY",
  timeFormat: "12-hour",
  landingPage: "Home",
  timezone: "Asia/Kolkata",
  profileName: "Alex Morgan",
  profileEmail: "alex.morgan@milta.io",
  profilePhone: "+91 98765 43210",
  profilePassword: "",
  profilePhotoName: "profile-avatar.png",
  profilePhotoPreview: "",
  signatureMode: "Rich text",
  signatureText: "Regards,\nAlex Morgan\nProgram Director",
  systemNotifications: true,
  taskUpdates: true,
  mentions: true,
  projectUpdates: true,
  feedRealtime: true,
  watchItems: true,
  followProjects: true,
  emailPreference: "Immediate",
  emailFormat: "HTML",
  emailFrequency: "Business hours",
  reminderDaily: true,
  reminderTime: "08:30",
  deadlineAlerts: true,
  followUpReminders: true,
  scheduleSync: "Google Calendar",
  scheduleDownload: "ICS",
  portalName: "Milta Projects",
  portalUrl: "https://projects.milta.io",
  logoName: "milta-logo.svg",
  logoPreview: "",
  organizationName: "Milta Digital Labs",
  organizationAddress: "Bangalore, India",
  organizationPhone: "+91 80456 12000",
  portalTimezone: "Asia/Kolkata",
  portalCurrency: "USD",
  projectPrefix: "PRJ",
  budgetEnabled: true,
  costTracking: true,
  budgetAlerts: true,
  taxRate: 18,
  paymentTermsDays: 30,
  usdInrRate: 83.5,
  defaultHourlyRateUsd: 42,
  invoiceNotes: "Invoices are due within 30 days.",
  dependencyMode: "Strict",
  timeTrackingMode: "Both",
  billableTracking: true,
  timesheetApproval: true,
  triggerEmails: true,
  userEmailPreferences: true,
  notificationRules: "Priority-based",
  aiSuggestions: true,
  aiTaskDescription: true,
  aiPredictDelays: true,
  aiInsightsDashboard: true,
  workflowTrigger: "Update",
  workflowAction: "Assign",
  emailTemplateEditor: "Rich text builder enabled",
  emailAlertTemplate: "Project status update",
  webhookPayload: "{\n  \"event\": \"task.updated\",\n  \"tenant\": \"milta-demo\"\n}",
  macroExecutionMode: "Manual review",
  timesheetAutoApproval: false,
  creditLimit: 50000,
  apiCreditsUsed: 18420,
  aiCreditsUsed: 9620,
  automationCreditsUsed: 12300,
  hierarchyMode: "Department-first",
  storageUsedGb: 184,
  storageLimitGb: 500,
  fileSizeLimitMb: 250,
  backupSchedule: "Daily at 02:00",
  backupRetention: "30 days",
  backupExportFormat: "ZIP + JSON",
};

export const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export const SETTINGS_PANELS = {
  "personal-preferences": {
    title: "Personal Preferences",
    category: "Personal",
    badge: "Personal",
    description: "Tune the day-to-day workspace experience for each signed-in user.",
    stats: [
      { label: "Applies To", value: "Current user" },
      { label: "Policy", value: "User override" },
      { label: "Sync", value: "Instant" },
    ],
    groups: [
      {
        title: "Workspace Experience",
        fields: [
          { key: "theme", label: "Theme", type: "segmented", options: ["Light", "Dark", "System"] },
          { key: "language", label: "Language", type: "select", options: ["English", "French", "German", "Japanese"] },
          { key: "landingPage", label: "Default landing page", type: "select", options: ["Home", "Projects", "Dashboard", "Notifications"] },
        ],
      },
      {
        title: "Regional Format",
        fields: [
          { key: "dateFormat", label: "Date format", type: "select", options: ["DD MMM YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
          { key: "timeFormat", label: "Time format", type: "select", options: ["12-hour", "24-hour"] },
          { key: "timezone", label: "Timezone", type: "select", options: TIMEZONE_OPTIONS },
        ],
      },
    ],
  },
  "personal-settings": {
    title: "Personal Settings",
    category: "Personal",
    badge: "Identity",
    description: "Manage profile details, password preferences, and your personal signature block.",
    groups: [
      {
        title: "Profile",
        fields: [
          { key: "profileName", label: "Name", type: "text" },
          { key: "profileEmail", label: "Email", type: "email" },
          { key: "profilePhone", label: "Phone", type: "tel" },
          { key: "profilePassword", label: "Change password", type: "password", placeholder: "Enter a new password" },
          { key: "profilePhotoName", label: "Profile photo", type: "file" },
        ],
      },
      {
        title: "Signature",
        fields: [
          { key: "signatureMode", label: "Signature settings", type: "select", options: ["Rich text", "Plain text", "Disabled"] },
          { key: "signatureText", label: "Signature content", type: "textarea", rows: 4 },
        ],
      },
    ],
  },
  notifications: {
    title: "Notifications",
    category: "Personal",
    badge: "Alerts",
    description: "Choose which system events should reach you inside the product.",
    groups: [
      {
        title: "In-app Notifications",
        fields: [
          { key: "systemNotifications", label: "Enable system notifications", type: "toggle" },
          { key: "taskUpdates", label: "Task updates", type: "toggle" },
          { key: "mentions", label: "Mentions", type: "toggle" },
          { key: "projectUpdates", label: "Project updates", type: "toggle" },
        ],
      },
    ],
  },
  "feed-notifications": {
    title: "Feed Notifications",
    category: "Personal",
    badge: "Feed",
    description: "Control watch states and real-time feed behavior for projects and tasks.",
    groups: [
      {
        title: "Activity Feed",
        fields: [
          { key: "feedRealtime", label: "Real-time activity feed", type: "toggle" },
          { key: "watchItems", label: "Watch or unwatch items automatically", type: "toggle" },
          { key: "followProjects", label: "Follow projects and tasks", type: "toggle" },
        ],
      },
    ],
  },
  "personal-email": {
    title: "Personal Email",
    category: "Personal",
    badge: "Email",
    description: "Set how the system communicates with you outside the app.",
    groups: [
      {
        title: "Delivery",
        fields: [
          { key: "emailPreference", label: "Email preference", type: "segmented", options: ["Immediate", "Daily digest"] },
          { key: "emailFormat", label: "Email format", type: "segmented", options: ["HTML", "Text"] },
          { key: "emailFrequency", label: "Email frequency", type: "select", options: ["Business hours", "Twice daily", "Once daily"] },
        ],
      },
    ],
  },
  "activity-reminder": {
    title: "Activity Reminder",
    category: "Personal",
    badge: "Reminder",
    description: "Stay ahead of deadlines with scheduled nudges and follow-up prompts.",
    groups: [
      {
        title: "Reminder Rules",
        fields: [
          { key: "reminderDaily", label: "Daily reminder", type: "toggle" },
          { key: "reminderTime", label: "Reminder time", type: "time" },
          { key: "deadlineAlerts", label: "Task deadline alerts", type: "toggle" },
          { key: "followUpReminders", label: "Follow-up reminders", type: "toggle" },
        ],
      },
    ],
  },
  "schedule-export": {
    title: "Schedule Export",
    category: "Personal",
    badge: "Calendar",
    description: "Link schedules to external calendars and export snapshots on demand.",
    groups: [
      {
        title: "Calendar Sync",
        fields: [
          { key: "scheduleSync", label: "Calendar sync", type: "select", options: ["Google Calendar", "iCal", "Outlook"] },
          { key: "scheduleDownload", label: "Download format", type: "segmented", options: ["CSV", "ICS"] },
        ],
      },
    ],
  },
  "portal-configuration-main": {
    title: "Portal Configuration",
    category: "Portal Configuration",
    badge: "Tenant",
    description: "Define tenant identity, branding, organization metadata, and regional defaults.",
    stats: [
      { label: "Architecture", value: "Multi-tenant" },
      { label: "Access", value: "Admin only" },
      { label: "Surface", value: "API-first" },
    ],
    groups: [
      {
        title: "Branding",
        fields: [
          { key: "portalName", label: "Portal name", type: "text" },
          { key: "portalUrl", label: "Portal URL", type: "text" },
          { key: "logoName", label: "Upload logo", type: "file" },
        ],
      },
      {
        title: "Organization Details",
        fields: [
          { key: "organizationName", label: "Organization", type: "text" },
          { key: "organizationAddress", label: "Address", type: "text" },
          { key: "organizationPhone", label: "Phone", type: "tel" },
          { key: "portalTimezone", label: "Timezone", type: "select", options: TIMEZONE_OPTIONS },
          { key: "portalCurrency", label: "Currency", type: "select", options: ["USD", "INR", "EUR", "GBP"] },
        ],
      },
    ],
  },
  "business-calendar": {
    title: "Business Calendar",
    category: "Portal Configuration",
    badge: "Calendar",
    description: "Configure working weeks, office hours, holidays, and additional timezone calendars.",
    groups: [
      {
        title: "Business Hours",
        fields: [
          { key: "businessHoursStart", label: "Start time", type: "time", fallback: "09:00" },
          { key: "businessHoursEnd", label: "End time", type: "time", fallback: "18:00" },
        ],
      },
    ],
    collections: [
      {
        title: "Working Days",
        type: "tags",
        key: "workingDays",
      },
      {
        title: "Holidays",
        type: "list",
        key: "holidays",
      },
      {
        title: "Timezone Calendars",
        type: "list",
        key: "timezoneCalendars",
      },
    ],
  },
  "project-budget": {
    title: "Project & Budget",
    category: "Portal Configuration",
    badge: "Budgeting",
    description: "Set project numbering, budget governance, and the financial defaults used across the portal.",
    groups: [
      {
        title: "Project Controls",
        fields: [
          { key: "projectPrefix", label: "Project prefix", type: "text" },
          { key: "budgetEnabled", label: "Enable budgets", type: "toggle" },
          { key: "costTracking", label: "Cost tracking", type: "toggle" },
          { key: "budgetAlerts", label: "Budget alerts", type: "toggle" },
        ],
      },
      {
        title: "Billing Defaults",
        fields: [
          { key: "taxRate", label: "Tax rate (%)", type: "number" },
          { key: "paymentTermsDays", label: "Payment terms (days)", type: "number" },
          { key: "usdInrRate", label: "USD to INR rate", type: "number", step: "0.01" },
          { key: "defaultHourlyRateUsd", label: "Default hourly rate (USD)", type: "number", step: "0.01" },
          { key: "invoiceNotes", label: "Invoice notes", type: "textarea", rows: 3 },
        ],
      },
    ],
  },
  "task-timesheet": {
    title: "Task & Timesheet",
    category: "Portal Configuration",
    badge: "Execution",
    description: "Own task states, priorities, dependency rules, and time-entry behavior centrally.",
    groups: [
      {
        title: "Execution Rules",
        fields: [
          { key: "dependencyMode", label: "Dependency settings", type: "select", options: ["Strict", "Flexible", "Disabled"] },
          { key: "timeTrackingMode", label: "Time tracking", type: "segmented", options: ["Timer", "Manual", "Both"] },
          { key: "billableTracking", label: "Billable vs non-billable", type: "toggle" },
          { key: "timesheetApproval", label: "Timesheet approval", type: "toggle" },
        ],
      },
    ],
    collections: [
      { title: "Task Statuses", type: "list", key: "taskStatuses" },
      { title: "Task Priorities", type: "list", key: "taskPriorities" },
    ],
  },
  "portal-email-notifications": {
    title: "Portal Email Notifications",
    category: "Portal Configuration",
    badge: "Rules",
    description: "Manage trigger-based emails and default notification policies for the full tenant.",
    groups: [
      {
        title: "Email Rules",
        fields: [
          { key: "triggerEmails", label: "Trigger-based emails", type: "toggle" },
          { key: "userEmailPreferences", label: "User-level email preferences", type: "toggle" },
          { key: "notificationRules", label: "Notification rules", type: "select", options: ["Priority-based", "All activities", "Minimal"] },
        ],
      },
    ],
  },
  "ai-hub": {
    title: "AI Hub",
    category: "Portal Configuration",
    badge: "AI",
    description: "Toggle AI assistance, auto-generated descriptions, delay prediction, and insights.",
    groups: [
      {
        title: "AI Controls",
        fields: [
          { key: "aiSuggestions", label: "AI suggestions", type: "toggle" },
          { key: "aiTaskDescription", label: "Task auto-description", type: "toggle" },
          { key: "aiPredictDelays", label: "Predict delays", type: "toggle" },
          { key: "aiInsightsDashboard", label: "Smart insights dashboard", type: "toggle" },
        ],
      },
    ],
  },
  "workflow-rules": {
    title: "Workflow Rules",
    category: "Automation",
    badge: "Automation",
    description: "Build event-driven rules using conditions, triggers, and field-level actions.",
    groups: [
      {
        title: "Rule Builder",
        fields: [
          { key: "workflowTrigger", label: "Trigger", type: "segmented", options: ["Create", "Update", "Delete"] },
          { key: "workflowAction", label: "Action", type: "select", options: ["Assign", "Notify", "Update fields"] },
        ],
      },
    ],
    collections: [{ title: "Rules", type: "list", key: "workflowRules" }],
  },
  "task-blueprint": {
    title: "Task Blueprint",
    category: "Automation",
    badge: "Blueprint",
    description: "Control stage-based task flow, transitions, and approval gates.",
    collections: [
      { title: "Status Flow", type: "pipeline", key: "taskBlueprintStages" },
      { title: "Transition Rules", type: "list", key: "transitionRules" },
    ],
  },
  "email-templates": {
    title: "Email Templates",
    category: "Automation",
    badge: "Templates",
    description: "Create reusable email templates with dynamic placeholders and rich text structure.",
    groups: [
      {
        title: "Composer",
        fields: [{ key: "emailTemplateEditor", label: "Template builder", type: "textarea", rows: 5 }],
      },
    ],
    collections: [{ title: "Template Library", type: "list", key: "emailTemplates" }],
  },
  "email-alerts": {
    title: "Email Alerts",
    category: "Automation",
    badge: "Alerts",
    description: "Map events to email templates and automate outbound messages from one place.",
    groups: [
      {
        title: "Alert Mapping",
        fields: [{ key: "emailAlertTemplate", label: "Default event template", type: "select", options: ["Project status update", "Task assignment", "Timesheet reminder"] }],
      },
    ],
    collections: [{ title: "Active Alerts", type: "list", key: "emailAlerts" }],
  },
  webhooks: {
    title: "Webhooks",
    category: "Automation",
    badge: "Integration",
    description: "Connect external systems with event-driven webhooks and JSON payload settings.",
    groups: [
      {
        title: "Payload",
        fields: [{ key: "webhookPayload", label: "JSON payload configuration", type: "textarea", rows: 6 }],
      },
    ],
    collections: [{ title: "Webhook Endpoints", type: "list", key: "webhooks" }],
  },
  "macro-rules": {
    title: "Macro Rules",
    category: "Automation",
    badge: "Macros",
    description: "Automate multi-step bulk actions for tasks, issues, and approval operations.",
    groups: [
      {
        title: "Execution",
        fields: [{ key: "macroExecutionMode", label: "Execution mode", type: "select", options: ["Manual review", "Immediate", "Scheduled"] }],
      },
    ],
    collections: [{ title: "Macro Library", type: "list", key: "macroRules" }],
  },
  "timesheet-approval-rules": {
    title: "Timesheet Approval Rules",
    category: "Automation",
    badge: "Approvals",
    description: "Define multi-level approval routing and auto-approval behavior for submitted time.",
    groups: [
      {
        title: "Approval Logic",
        fields: [{ key: "timesheetAutoApproval", label: "Auto approval", type: "toggle" }],
      },
    ],
    collections: [{ title: "Approval Levels", type: "list", key: "timesheetApprovalRules" }],
  },
  credits: {
    title: "Credits",
    category: "Automation",
    badge: "Usage",
    description: "Track API, AI, and automation consumption against shared tenant credit limits.",
    groups: [
      {
        title: "Credit Controls",
        fields: [{ key: "creditLimit", label: "Credit limit", type: "number" }],
      },
    ],
    collections: [{ title: "Usage Breakdown", type: "meter-list", key: "creditUsage" }],
  },
  "directory-configuration": {
    title: "Directory Configuration",
    category: "Zoho Directory",
    badge: "Org",
    description: "Model organization hierarchy, departments, and employee mapping for directory sync.",
    groups: [
      {
        title: "Hierarchy",
        fields: [{ key: "hierarchyMode", label: "Organization hierarchy", type: "select", options: ["Department-first", "Region-first", "Flat teams"] }],
      },
    ],
    collections: [
      { title: "Departments", type: "list", key: "departments" },
      { title: "Employee Mapping", type: "list", key: "employeeMappings" },
    ],
  },
  storage: {
    title: "Storage",
    category: "Data Administration",
    badge: "Storage",
    description: "Monitor tenant storage usage and define guardrails for uploaded files.",
    groups: [
      {
        title: "Limits",
        fields: [
          { key: "storageLimitGb", label: "Storage limit (GB)", type: "number" },
          { key: "fileSizeLimitMb", label: "File size limit (MB)", type: "number" },
        ],
      },
    ],
    collections: [{ title: "Usage Meter", type: "storage-meter", key: "storageUsage" }],
  },
  backup: {
    title: "Backup",
    category: "Data Administration",
    badge: "Backup",
    description: "Export all tenant data, control backup cadence, and review the latest snapshots.",
    groups: [
      {
        title: "Backup Rules",
        fields: [
          { key: "backupSchedule", label: "Scheduled backups", type: "text" },
          { key: "backupRetention", label: "Retention", type: "select", options: ["7 days", "30 days", "90 days"] },
          { key: "backupExportFormat", label: "Export format", type: "select", options: ["ZIP + JSON", "CSV bundle", "SQL dump"] },
        ],
      },
    ],
    collections: [{ title: "Backup History", type: "list", key: "backups", readOnly: true }],
  },
  "recycle-bin": {
    title: "Recycle Bin",
    category: "Data Administration",
    badge: "Recovery",
    description: "Review deleted records, restore them, or permanently purge them when required.",
    collections: [{ title: "Deleted Items", type: "list", key: "recycleBin", readOnly: true }],
  },
  "audit-log": {
    title: "Audit Log",
    category: "Data Administration",
    badge: "Compliance",
    description: "Inspect activity history with filters for date, user, and action categories.",
    collections: [{ title: "Audit Events", type: "table", key: "auditLogs", readOnly: true }],
  },
  "portal-users": {
    title: "Portal Users",
    category: "Manage Users",
    badge: "Users",
    description: "Create, edit, and retire internal users while controlling roles and permissions.",
    collections: [{ title: "Users", type: "table", key: "portalUsers" }],
  },
  "client-users": {
    title: "Client Users",
    category: "Manage Users",
    badge: "Clients",
    description: "Manage external stakeholders with restricted visibility and scoped access.",
    collections: [{ title: "Client Access", type: "table", key: "clientUsers" }],
  },
  teams: {
    title: "Teams",
    category: "Manage Users",
    badge: "Teams",
    description: "Group users into delivery teams and assign them to active workstreams.",
    collections: [{ title: "Team Directory", type: "list", key: "teams" }],
  },
  resources: {
    title: "Resources",
    category: "Manage Users",
    badge: "Capacity",
    description: "Track resource allocation, workload balance, and utilization risk across teams.",
    collections: [{ title: "Allocation", type: "table", key: "resources" }],
  },
  "invitation-templates": {
    title: "Invitation Templates",
    category: "Manage Users",
    badge: "Invite",
    description: "Customize invitation content used for portal onboarding and access requests.",
    collections: [{ title: "Templates", type: "list", key: "invitationTemplates" }],
  },
  profiles: {
    title: "Profiles",
    category: "Manage Users",
    badge: "Profile",
    description: "Create permission profiles with module-level access controls and policy bundles.",
    collections: [{ title: "Permission Profiles", type: "list", key: "profiles" }],
  },
  roles: {
    title: "Roles",
    category: "Manage Users",
    badge: "Roles",
    description: "Define reporting structure, hierarchy rules, and responsibility layers across the portal.",
    collections: [{ title: "Role Hierarchy", type: "pipeline", key: "rolesHierarchy" }],
  },
};

export function createInitialCollections() {
  return {
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
    workingDays: [
      { label: "Mon", active: true },
      { label: "Tue", active: true },
      { label: "Wed", active: true },
      { label: "Thu", active: true },
      { label: "Fri", active: true },
      { label: "Sat", active: false },
      { label: "Sun", active: false },
    ],
    holidays: [
      { title: "New Year Holiday", meta: "01 Jan 2026", status: "Global" },
      { title: "Founders Day", meta: "15 Aug 2026", status: "India" },
      { title: "Winter Shutdown", meta: "24 Dec 2026", status: "Company" },
    ],
    timezoneCalendars: [
      { title: "India Delivery Hub", meta: "Asia/Kolkata", status: "Primary" },
      { title: "US Client Window", meta: "America/New_York", status: "Shared" },
      { title: "EMEA Coverage", meta: "Europe/London", status: "Read only" },
    ],
    taskStatuses: [
      { title: "Open", meta: "Default", status: "Enabled" },
      { title: "In Progress", meta: "Execution", status: "Enabled" },
      { title: "Waiting for Review", meta: "Approval", status: "Enabled" },
      { title: "Done", meta: "Closed", status: "Enabled" },
    ],
    taskPriorities: [
      { title: "Low", meta: "SLA 5d", status: "Enabled" },
      { title: "Medium", meta: "SLA 3d", status: "Enabled" },
      { title: "High", meta: "SLA 1d", status: "Enabled" },
      { title: "Critical", meta: "Escalation", status: "Enabled" },
    ],
    workflowRules: [
      { title: "Auto-assign QA owner", meta: "On status change to Review", status: "Active" },
      { title: "Notify project sponsor", meta: "When budget crosses 90%", status: "Active" },
    ],
    taskBlueprintStages: [
      { title: "Intake", meta: "Capture request" },
      { title: "Planning", meta: "Estimate and approve" },
      { title: "Execution", meta: "Deliver work" },
      { title: "Closure", meta: "Validate and archive" },
    ],
    transitionRules: [
      { title: "Planning to Execution", meta: "Estimate and owner required", status: "Guarded" },
      { title: "Execution to Closure", meta: "QA sign-off required", status: "Guarded" },
    ],
    emailTemplates: [
      { title: "Project Kickoff", meta: "{{project_name}}, {{owner_name}}", status: "Published" },
      { title: "Task Assignment", meta: "{{task_name}}, {{assignee}}", status: "Published" },
    ],
    emailAlerts: [
      { title: "Task assignment alert", meta: "Event: task.created", status: "Enabled" },
      { title: "Timesheet reminder", meta: "Event: timesheet.pending", status: "Enabled" },
    ],
    webhooks: [
      { title: "Jira Sync", meta: "POST https://hooks.example.com/jira", status: "Healthy" },
      { title: "ERP Budget Feed", meta: "POST https://hooks.example.com/erp", status: "Healthy" },
    ],
    macroRules: [
      { title: "Close completed tasks", meta: "Bulk mark done + notify", status: "Ready" },
      { title: "Reassign delayed work", meta: "Escalate to manager", status: "Ready" },
    ],
    timesheetApprovalRules: [
      { title: "Team Lead", meta: "Level 1 approval", status: "Required" },
      { title: "Delivery Manager", meta: "Level 2 approval", status: "Conditional" },
      { title: "Finance", meta: "Billable timesheets only", status: "Conditional" },
    ],
    creditUsage: [
      { title: "API Credits", used: 18420, limit: 50000 },
      { title: "AI Credits", used: 9620, limit: 50000 },
      { title: "Automation Credits", used: 12300, limit: 50000 },
    ],
    departments: [
      { title: "Delivery", meta: "82 employees", status: "Active" },
      { title: "Product", meta: "27 employees", status: "Active" },
      { title: "Finance", meta: "11 employees", status: "Active" },
    ],
    employeeMappings: [
      { title: "EMP-1004 -> Delivery", meta: "Mapped to Resource Pool A", status: "Synced" },
      { title: "EMP-1057 -> Product", meta: "Mapped to Design Ops", status: "Synced" },
    ],
    storageUsage: [],
    backups: [
      { title: "Full backup", meta: "26 Apr 2026 02:00", status: "Completed" },
      { title: "Delta backup", meta: "27 Apr 2026 02:00", status: "Completed" },
    ],
    recycleBin: [
      { title: "Task PRJ-0193", meta: "Deleted by Sarah Lee", status: "Recoverable" },
      { title: "Client workspace: Nimbus", meta: "Deleted by Admin", status: "Recoverable" },
    ],
    auditLogs: [
      { date: "27 Apr 2026", user: "Alex Morgan", action: "Updated workflow rule", module: "Automation" },
      { date: "27 Apr 2026", user: "Sarah Lee", action: "Added portal user", module: "Users" },
      { date: "26 Apr 2026", user: "Finance Bot", action: "Generated backup", module: "Data" },
    ],
    portalUsers: [
      { name: "Alex Morgan", role: "Admin", status: "Active", scope: "Full portal" },
      { name: "Sarah Lee", role: "Manager", status: "Active", scope: "Delivery" },
      { name: "Vikram Rao", role: "Employee", status: "Invited", scope: "Engineering" },
    ],
    clientUsers: [
      { name: "Rachel Kim", role: "Client", status: "Active", scope: "Project Nimbus" },
      { name: "Jordan Moss", role: "Client", status: "Active", scope: "Project Atlas" },
    ],
    teams: [
      { title: "Platform Team", meta: "12 members", status: "4 active projects" },
      { title: "Client Success", meta: "8 members", status: "2 active projects" },
    ],
    resources: [
      { name: "Platform Team", role: "Shared pool", status: "81% allocated", scope: "Healthy" },
      { name: "Design Ops", role: "Specialist pool", status: "96% allocated", scope: "Watchlist" },
    ],
    invitationTemplates: [
      { title: "Internal user invite", meta: "Standard onboarding copy", status: "Default" },
      { title: "Client invite", meta: "Restricted access wording", status: "Default" },
    ],
    profiles: [
      { title: "Program Admin", meta: "Full access", status: "24 permissions" },
      { title: "Delivery Manager", meta: "Project + reports", status: "16 permissions" },
      { title: "Client Viewer", meta: "Read only", status: "6 permissions" },
    ],
    rolesHierarchy: [
      { title: "Executive Sponsor", meta: "Top-level oversight" },
      { title: "Program Director", meta: "Portfolio owner" },
      { title: "Delivery Manager", meta: "Team lead" },
      { title: "Contributor", meta: "Execution role" },
    ],
  };
}

export function getVisibleSettingsNav(role, searchTerm) {
  const normalized = (searchTerm || "").trim().toLowerCase();

  return SETTINGS_NAV.map((section) => {
    const items = section.items.filter((item) => {
      const roleVisible = !role || item.roles.includes(role);
      const searchVisible =
        !normalized ||
        item.label.toLowerCase().includes(normalized) ||
        section.label.toLowerCase().includes(normalized);

      return roleVisible && searchVisible;
    });

    return { ...section, items };
  }).filter((section) => section.items.length > 0);
}
