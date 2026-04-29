import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import { useTheme } from "../../context/ThemeContext";
import {
  clearAuth,
  createEmployeeOrManager,
  getAdminInvoices,
  getAllTasks,
  getAttachments,
  getClients,
  getCurrentUser,
  getInvoiceSettings,
  getIssues,
  getMilestones,
  getMyNotifications,
  getOrganizations,
  getProjects,
  getProjectGroupStats,
  getReportsSummary,
  getRoles,
  getTaskActivity,
  getUsers,
  createProjectGroup,
  updateInvoiceSettings,
  updateUserStatus,
} from "../../services/auth";
import {
  createInitialCollections,
  DEFAULT_SETTINGS,
  getVisibleSettingsNav,
  SETTINGS_PANELS,
} from "./settingsSchema";

const SETTINGS_STORAGE_PREFIX = "milta.setup.settings";
const GIGABYTE = 1024 * 1024 * 1024;
const DELETED_RECORDS_NOTE =
  "Live deleted module records are not available yet because the current backend does not expose soft-delete or restore endpoints.";

function getSettingsStorageKey(userId) {
  return `${SETTINGS_STORAGE_PREFIX}.${userId || "anonymous"}`;
}

function buildDefaultState(user, invoiceSettings) {
  return {
    ...DEFAULT_SETTINGS,
    ...createInitialCollections(),
    profileName: user?.name || DEFAULT_SETTINGS.profileName,
    profileEmail: user?.email || DEFAULT_SETTINGS.profileEmail,
    profilePhone: user?.phone || DEFAULT_SETTINGS.profilePhone,
    portalCurrency: invoiceSettings?.currency || DEFAULT_SETTINGS.portalCurrency,
    taxRate: invoiceSettings?.tax_rate ?? DEFAULT_SETTINGS.taxRate,
    paymentTermsDays: invoiceSettings?.payment_terms_days ?? DEFAULT_SETTINGS.paymentTermsDays,
    usdInrRate: invoiceSettings?.usd_inr_rate ?? DEFAULT_SETTINGS.usdInrRate,
    defaultHourlyRateUsd: invoiceSettings?.default_hourly_rate_usd ?? DEFAULT_SETTINGS.defaultHourlyRateUsd,
    invoiceNotes: invoiceSettings?.notes || DEFAULT_SETTINGS.invoiceNotes,
  };
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLatestTimestamp(items) {
  return (items || []).reduce((latest, item) => {
    const current = new Date(item?.updatedAt || item?.createdAt || 0).getTime();
    return current > latest ? current : latest;
  }, 0);
}

function estimateStructuredBytes(count, averageKilobytes) {
  return count * averageKilobytes * 1024;
}

function buildBackupRows({
  projects,
  tasks,
  issues,
  milestones,
  attachments,
  users,
  invoices,
  reportsSummary,
}) {
  return [
    {
      title: "Portfolio snapshot",
      meta: `${projects.length} projects, ${tasks.length} tasks, ${milestones.length} milestones`,
      status: `Updated ${formatDateTime(getLatestTimestamp([...projects, ...tasks, ...milestones]))}`,
    },
    {
      title: "Operations snapshot",
      meta: `${issues.length} issues, ${attachments.length} attachments, ${users.length} users`,
      status: `Updated ${formatDateTime(getLatestTimestamp([...issues, ...attachments, ...users]))}`,
    },
    {
      title: "Finance snapshot",
      meta: `${invoices.length} invoices, ${reportsSummary?.timesheets?.total || 0} timesheets`,
      status: `Updated ${formatDateTime(getLatestTimestamp(invoices))}`,
    },
  ];
}

function buildModuleEvents(items, options) {
  return (items || [])
    .map((item) => ({
      timestamp: item?.updatedAt || item?.createdAt || null,
      date: formatDateTime(item?.updatedAt || item?.createdAt),
      user: options.getUser(item),
      action: options.getAction(item),
      module: options.module,
      details: options.getDetails(item),
    }))
    .filter((entry) => entry.timestamp);
}

function buildDerivedDataAdministrationState({
  projects = [],
  tasks = [],
  issues = [],
  milestones = [],
  attachments = [],
  users = [],
  invoices = [],
  reportsSummary = null,
  taskActivities = [],
}) {
  const attachmentBytes = attachments.reduce((sum, item) => sum + Number(item?.size || 0), 0);
  const estimatedBytes =
    estimateStructuredBytes(projects.length, 12) +
    estimateStructuredBytes(tasks.length, 8) +
    estimateStructuredBytes(issues.length, 6) +
    estimateStructuredBytes(milestones.length, 4) +
    estimateStructuredBytes(users.length, 5) +
    estimateStructuredBytes(invoices.length, 6) +
    estimateStructuredBytes(reportsSummary?.timesheets?.total || 0, 3);

  const totalBytes = attachmentBytes + estimatedBytes;
  const storageUsedGb = Number((totalBytes / GIGABYTE).toFixed(2));

  const moduleSizes = [
    { name: "Tasks", count: tasks.length },
    { name: "Projects", count: projects.length },
    { name: "Attachments", count: attachments.length },
    { name: "Issues", count: issues.length },
    { name: "Milestones", count: milestones.length },
    { name: "Users", count: users.length },
  ];
  const largestModule = moduleSizes.sort((left, right) => right.count - left.count)[0]?.name || "Tasks";

  const moduleEvents = [
    ...buildModuleEvents(projects, {
      module: "Projects",
      getUser: (item) => item?.CreatedBy?.name || "System",
      getAction: () => "Project snapshot refreshed",
      getDetails: (item) => item?.project_title || item?.project_code || "Project",
    }),
    ...buildModuleEvents(issues, {
      module: "Issues",
      getUser: (item) => item?.Reporter?.name || item?.Assignee?.name || "System",
      getAction: (item) => `${item?.status || "Issue"} issue tracked`,
      getDetails: (item) => item?.title || item?.issue_title || item?.issue_code || "Issue",
    }),
    ...buildModuleEvents(milestones, {
      module: "Milestones",
      getUser: (item) => item?.Owner?.name || "System",
      getAction: () => "Milestone synced",
      getDetails: (item) => item?.title || item?.name || "Milestone",
    }),
    ...buildModuleEvents(attachments, {
      module: "Attachments",
      getUser: (item) => item?.UploadedBy?.name || item?.UploadedBy?.username || "System",
      getAction: () => "Attachment indexed",
      getDetails: (item) => item?.originalName || item?.storedName || "Attachment",
    }),
    ...buildModuleEvents(invoices, {
      module: "Invoices",
      getUser: () => "System",
      getAction: (item) => `Invoice ${item?.status || "generated"}`,
      getDetails: (item) => item?.invoice_number || item?.invoiceNumber || `Invoice #${item?.id || "-"}`,
    }),
  ];

  const auditLogs = [...taskActivities, ...moduleEvents]
    .sort((left, right) => new Date(right.timestamp || 0) - new Date(left.timestamp || 0))
    .slice(0, 16)
    .map((entry) => ({
      date: entry.date,
      user: entry.user,
      action: entry.action,
      module: entry.module,
      details: entry.details,
    }));

  return {
    storageUsedGb,
    storageFileCount: attachments.length,
    storageLargestModule: largestModule,
    backups: buildBackupRows({
      projects,
      tasks,
      issues,
      milestones,
      attachments,
      users,
      invoices,
      reportsSummary,
    }),
    recycleBin: [
      {
        title: "No recoverable module records detected",
        meta: DELETED_RECORDS_NOTE,
        status: "Waiting for backend support",
      },
    ],
    auditLogs,
  };
}

function getRoleName(userRecord) {
  return userRecord?.role || userRecord?.Role?.name || "-";
}

function getUserStatusLabel(userRecord) {
  return userRecord?.is_active ? "Active" : "Inactive";
}

function buildProfilesFromProject() {
  return [
    { title: "Admin Control", meta: "Home, Dashboard, Invoices, Time Logs, Clients, Settings", status: "System profile" },
    { title: "Delivery Manager", meta: "Projects, Task Board, Reports, Milestones, Issues", status: "System profile" },
    { title: "Execution User", meta: "Tasks, Milestones, Issues, Notifications", status: "System profile" },
    { title: "Client Viewer", meta: "Home, Dashboard, Notifications", status: "System profile" },
  ];
}

function getRoleDescription(roleName) {
  if (roleName === "Admin") return "Full workspace governance";
  if (roleName === "Manager") return "Project planning and task control";
  if (roleName === "Employee") return "Execution and timesheet delivery";
  if (roleName === "Client") return "External visibility and approvals";
  return "Custom application role";
}

function buildManageUsersState({ users = [], clients = [], groupStats = [], roles = [], tasks = [] }) {
  const activeTasksByAssignee = tasks.reduce((map, task) => {
    const assigneeId = task?.assigneeId || task?.Assignee?.id;
    if (!assigneeId) return map;
    if (["Completed", "Approved"].includes(task?.status)) return map;
    map.set(assigneeId, (map.get(assigneeId) || 0) + 1);
    return map;
  }, new Map());

  const internalUsers = users.filter((userRecord) => getRoleName(userRecord) !== "Client");
  const clientUsers = users.filter((userRecord) => getRoleName(userRecord) === "Client");

  return {
    portalUsers: internalUsers.map((userRecord) => ({
      id: userRecord.id,
      name: userRecord.name,
      role: getRoleName(userRecord),
      status: getUserStatusLabel(userRecord),
      scope: userRecord.Organization?.name || "Internal workspace",
    })),
    clientUsers: clientUsers.map((userRecord) => ({
      id: userRecord.id,
      name: userRecord.name,
      role: getRoleName(userRecord),
      status: getUserStatusLabel(userRecord),
      scope:
        userRecord.ClientAccount?.name ||
        clients.find((client) => client.id === userRecord.clientId)?.name ||
        "Client workspace",
    })),
    teams: groupStats.map((group) => ({
      id: group.id,
      title: group.name,
      meta: `${group.projectCount || 0} active project${(group.projectCount || 0) === 1 ? "" : "s"}`,
      status: group.code,
    })),
    resources: internalUsers.map((userRecord) => ({
      name: userRecord.name,
      role: getRoleName(userRecord),
      status: `${activeTasksByAssignee.get(userRecord.id) || 0} active tasks`,
      scope: userRecord.is_active ? "Available" : "Inactive",
    })),
    invitationTemplates: [
      { title: "Internal user invite", meta: "Used for employee and manager onboarding", status: "Default" },
      { title: "Client invite", meta: "Used for external portal access", status: "Default" },
    ],
    profiles: buildProfilesFromProject(),
    rolesHierarchy: (roles || []).map((roleRecord) => ({
      title: roleRecord.name,
      meta: getRoleDescription(roleRecord.name),
    })),
  };
}

function buildProjectAwareState(defaultState, datasets) {
  const organizations = datasets.organizations || [];
  const primaryOrganization = organizations[0] || null;

  return {
    ...(primaryOrganization
      ? {
          organizationName: primaryOrganization.name || defaultState.organizationName,
          organizationAddress: primaryOrganization.description || defaultState.organizationAddress,
          portalName: `${primaryOrganization.name} Projects`,
        }
      : {}),
    ...buildManageUsersState(datasets),
    ...buildDerivedDataAdministrationState(datasets),
  };
}

async function fetchSettingsDatasets() {
  const [
    projectsResult,
    tasksResult,
    issuesResult,
    milestonesResult,
    usersResult,
    attachmentsResult,
    reportsSummaryResult,
    invoicesResult,
    clientsResult,
    groupStatsResult,
    rolesResult,
    organizationsResult,
    notificationsResult,
  ] = await Promise.allSettled([
    getProjects(),
    getAllTasks(),
    getIssues(),
    getMilestones(),
    getUsers(),
    getAttachments(),
    getReportsSummary(),
    getAdminInvoices(),
    getClients(),
    getProjectGroupStats(),
    getRoles(),
    getOrganizations(),
    getMyNotifications(),
  ]);

  const tasks = tasksResult.status === "fulfilled" ? tasksResult.value : [];
  const activityTasks = [...tasks]
    .sort(
      (left, right) =>
        new Date(right?.updatedAt || right?.createdAt || 0) -
        new Date(left?.updatedAt || left?.createdAt || 0)
    )
    .slice(0, 8);

  const taskActivityResults = await Promise.allSettled(
    activityTasks.map((task) => getTaskActivity(task.id))
  );

  const taskActivities = taskActivityResults
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value || [])
    .map((activity) => ({
      timestamp: activity?.createdAt,
      date: formatDateTime(activity?.createdAt),
      user: activity?.Actor?.name || activity?.Actor?.username || "System",
      action: activity?.action || "Task activity",
      module: activity?.Project ? "Projects" : "Tasks",
      details: activity?.message || activity?.entityType || "Task activity event",
    }));

  return {
    projects: projectsResult.status === "fulfilled" ? projectsResult.value : [],
    tasks,
    issues: issuesResult.status === "fulfilled" ? issuesResult.value : [],
    milestones: milestonesResult.status === "fulfilled" ? milestonesResult.value : [],
    users: usersResult.status === "fulfilled" ? usersResult.value : [],
    attachments: attachmentsResult.status === "fulfilled" ? attachmentsResult.value : [],
    reportsSummary: reportsSummaryResult.status === "fulfilled" ? reportsSummaryResult.value : null,
    invoices: invoicesResult.status === "fulfilled" ? invoicesResult.value : [],
    clients: clientsResult.status === "fulfilled" ? clientsResult.value : [],
    groupStats: groupStatsResult.status === "fulfilled" ? groupStatsResult.value : [],
    roles: rolesResult.status === "fulfilled" ? rolesResult.value : [],
    organizations: organizationsResult.status === "fulfilled" ? organizationsResult.value : [],
    notifications: notificationsResult.status === "fulfilled" ? notificationsResult.value : [],
    taskActivities,
  };
}

function buildPersistedState(state) {
  return {
    ...state,
    profilePassword: "",
    profilePhotoPreview: "",
    logoPreview: "",
  };
}

function sanitizeLoadedState(rawState, baseState) {
  if (!rawState || typeof rawState !== "object") {
    return baseState;
  }

  return {
    ...baseState,
    ...rawState,
    profilePassword: "",
  };
}

function findFirstVisibleItem(sections) {
  return sections[0]?.items?.[0]?.id || "";
}

function isPanelVisibleToRole(panelId, role) {
  return getVisibleSettingsNav(role, "").some((section) =>
    section.items.some((item) => item.id === panelId)
  );
}

function formatPercent(used, limit) {
  if (!limit) return 0;
  return Math.min(100, Math.round((Number(used) / Number(limit)) * 100));
}

function getPanelStateSlice(panel) {
  const keys = [];

  (panel?.groups || []).forEach((group) => {
    (group.fields || []).forEach((field) => keys.push(field.key));
  });

  (panel?.collections || []).forEach((collection) => keys.push(collection.key));

  return keys;
}

function toSentenceCase(value) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function getCollectionColumns(items, collectionType) {
  if (collectionType === "pipeline") {
    return ["title", "meta"];
  }

  const source = items?.[0];
  if (!source || typeof source !== "object") {
    return ["title", "meta", "status"];
  }

  return Object.keys(source);
}

function buildDraftForCollection(collection, items) {
  const columns = getCollectionColumns(items, collection.type);
  return columns.reduce((draft, column) => {
    draft[column] = "";
    return draft;
  }, {});
}

function formatModuleCount(value, noun) {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}



function Settings() {
  const { setTheme: setGlobalTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settingsState, setSettingsState] = useState(null);
  const [baseState, setBaseState] = useState(null);
  const [activeItemId, setActiveItemId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [collectionDrafts, setCollectionDrafts] = useState({});
  const [referenceData, setReferenceData] = useState({
    clients: [],
    roles: [],
    organizations: [],
    notifications: [],
  });
  const [portalUserForm, setPortalUserForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role_name: "Employee",
    hourly_rate: "",
  });
  const [clientUserForm, setClientUserForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    clientId: "",
  });
  const [teamForm, setTeamForm] = useState({
    name: "",
    code: "",
  });
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const hydrateSettingsState = async (currentUser, invoiceSettings) => {
    const defaultState = buildDefaultState(currentUser, invoiceSettings);
    const liveDatasets = await fetchSettingsDatasets();
    const liveState = buildProjectAwareState(defaultState, liveDatasets);
    const storageKey = getSettingsStorageKey(currentUser.id || currentUser.email);
    const storedState = window.localStorage.getItem(storageKey);
    const parsedState = storedState ? JSON.parse(storedState) : null;
    const mergedState = {
      ...sanitizeLoadedState(parsedState, defaultState),
      ...liveState,
    };

    setGlobalTheme(mergedState.theme);

    setBaseState(defaultState);
    setSettingsState(mergedState);
    setReferenceData({
      clients: liveDatasets.clients || [],
      roles: liveDatasets.roles || [],
      organizations: liveDatasets.organizations || [],
      notifications: liveDatasets.notifications || [],
    });
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const currentUser = await getCurrentUser();
        if (!active) return;

        if (currentUser.role !== "Admin") {
          navigate("/home", { replace: true });
          return;
        }

        let invoiceSettings = null;
        try {
          invoiceSettings = await getInvoiceSettings();
        } catch (_invoiceError) {
          invoiceSettings = null;
        }

        if (!active) return;

        await hydrateSettingsState(currentUser, invoiceSettings);
        const visibleNav = getVisibleSettingsNav(currentUser.role, "");

        setUser(currentUser);
        setActiveItemId(findFirstVisibleItem(visibleNav));
        setCollectionDrafts({});
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || "Failed to load settings.");
        clearAuth();
        navigate("/login", { replace: true });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [navigate]);

  const visibleSections = getVisibleSettingsNav(user?.role, deferredSearchTerm);

  useEffect(() => {
    if (!activeItemId || !isPanelVisibleToRole(activeItemId, user?.role)) {
      setActiveItemId(findFirstVisibleItem(visibleSections));
      return;
    }

    const stillVisible = visibleSections.some((section) =>
      section.items.some((item) => item.id === activeItemId)
    );

    if (!stillVisible) {
      setActiveItemId(findFirstVisibleItem(visibleSections));
    }
  }, [activeItemId, user?.role, visibleSections]);

  const activePanel = SETTINGS_PANELS[activeItemId];
  const specialPanelIds = ["portal-users", "client-users", "teams", "roles"];
  const totalModules = visibleSections.reduce((count, section) => count + section.items.length, 0);
  const totalSections = visibleSections.length;
  const collectionItemCount = useMemo(
    () =>
      (activePanel?.collections || []).reduce((count, collection) => {
        const data = settingsState?.[collection.key];
        return count + (Array.isArray(data) ? data.length : 0);
      }, 0),
    [activePanel, settingsState]
  );
  const fieldCount = useMemo(
    () =>
      (activePanel?.groups || []).reduce(
        (count, group) => count + (group.fields?.length || 0),
        0
      ),
    [activePanel]
  );
  const notificationsUnreadCount = useMemo(
    () => (referenceData.notifications || []).filter((item) => !item.isRead).length,
    [referenceData.notifications]
  );

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleFieldChange = (key, value) => {
    if (key === "theme") {
      setGlobalTheme(value);
    }
    setSettingsState((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSuccess("");
  };

  const handleFileChange = (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewKey = key === "profilePhotoName" ? "profilePhotoPreview" : key === "logoName" ? "logoPreview" : "";

    setSettingsState((prev) => ({
      ...prev,
      [key]: file.name,
      ...(previewKey ? { [previewKey]: window.URL.createObjectURL(file) } : {}),
    }));
    setSuccess("");
  };

  const handleToggleTag = (collectionKey, index) => {
    setSettingsState((prev) => ({
      ...prev,
      [collectionKey]: prev[collectionKey].map((item, itemIndex) =>
        itemIndex === index ? { ...item, active: !item.active } : item
      ),
    }));
    setSuccess("");
  };

  const handleResetPanel = () => {
    if (!activePanel || !baseState) return;

    const keys = getPanelStateSlice(activePanel);
    setSettingsState((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        next[key] = baseState[key];
      });
      next.profilePassword = "";
      return next;
    });
    setSuccess(`${activePanel.title} was reset to the current tenant defaults.`);
    setError("");
  };

  const handleDraftChange = (collectionKey, field, value) => {
    setCollectionDrafts((prev) => ({
      ...prev,
      [collectionKey]: {
        ...(prev[collectionKey] || {}),
        [field]: value,
      },
    }));
  };

  const handleAddCollectionItem = (collection) => {
    const currentItems = settingsState?.[collection.key] || [];
    const draft =
      collectionDrafts[collection.key] || buildDraftForCollection(collection, currentItems);
    const columns = getCollectionColumns(currentItems, collection.type);

    const nextItem = columns.reduce((item, column) => {
      item[column] = (draft[column] || "").trim();
      return item;
    }, {});

    const hasValue = Object.values(nextItem).some((value) => value);
    if (!hasValue) {
      setError(`Add at least one value to create a new ${collection.title.toLowerCase()} item.`);
      return;
    }

    setSettingsState((prev) => ({
      ...prev,
      [collection.key]: [...(prev[collection.key] || []), nextItem],
    }));
    setCollectionDrafts((prev) => ({
      ...prev,
      [collection.key]: buildDraftForCollection(collection, currentItems),
    }));
    setError("");
    setSuccess(`Added a new entry to ${collection.title}.`);
  };

  const handleDeleteCollectionItem = (collectionKey, index) => {
    const deletedItem = settingsState?.[collectionKey]?.[index];

    setSettingsState((prev) => ({
      ...prev,
      [collectionKey]: (prev[collectionKey] || []).filter((_, itemIndex) => itemIndex !== index),
      recycleBin:
        collectionKey === "recycleBin"
          ? prev.recycleBin
          : [
              {
                title:
                  deletedItem?.title ||
                  deletedItem?.name ||
                  deletedItem?.date ||
                  `Removed ${collectionKey} item`,
                meta: `Manually removed from ${collectionKey}`,
                status: "Local removal",
              },
              ...(prev.recycleBin || []).filter(
                (item) => item.meta !== DELETED_RECORDS_NOTE
              ),
            ],
    }));
    setSuccess("Entry removed from the current panel.");
    setError("");
  };

  const handleSaveSettings = async () => {
    if (!settingsState || !user) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const storageKey = getSettingsStorageKey(user.id || user.email);
      window.localStorage.setItem(storageKey, JSON.stringify(buildPersistedState(settingsState)));

      await updateInvoiceSettings({
        currency: settingsState.portalCurrency,
        tax_rate: Number(settingsState.taxRate),
        payment_terms_days: Number(settingsState.paymentTermsDays),
        usd_inr_rate: Number(settingsState.usdInrRate),
        default_hourly_rate_usd: Number(settingsState.defaultHourlyRateUsd),
        notes: settingsState.invoiceNotes,
      });

      setBaseState((prev) => ({
        ...prev,
        ...buildPersistedState(settingsState),
      }));
      setSettingsState((prev) => ({ ...prev, profilePassword: "" }));
      setSuccess(`${activePanel?.title || "Settings"} saved successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const reloadProjectAwareState = async () => {
    if (!user) return;

    let invoiceSettings = null;
    try {
      invoiceSettings = await getInvoiceSettings();
    } catch (_invoiceError) {
      invoiceSettings = null;
    }

    await hydrateSettingsState(user, invoiceSettings);
  };

  const handleCreatePortalUser = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createEmployeeOrManager({
        ...portalUserForm,
        hourly_rate: portalUserForm.hourly_rate ? Number(portalUserForm.hourly_rate) : null,
      });
      setPortalUserForm({
        name: "",
        username: "",
        email: "",
        password: "",
        role_name: "Employee",
        hourly_rate: "",
      });
      await reloadProjectAwareState();
      setSuccess("Portal user created.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create portal user.");
    }
  };

  const handleCreateClientUser = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createEmployeeOrManager({
        ...clientUserForm,
        role_name: "Client",
        clientId: Number(clientUserForm.clientId),
      });
      setClientUserForm({
        name: "",
        username: "",
        email: "",
        password: "",
        clientId: "",
      });
      await reloadProjectAwareState();
      setSuccess("Client user created.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create client user.");
    }
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await createProjectGroup({
        name: teamForm.name.trim(),
        code: teamForm.code.trim().toUpperCase(),
      });
      setTeamForm({ name: "", code: "" });
      await reloadProjectAwareState();
      setSuccess("Team workspace created.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create team.");
    }
  };

  const handleToggleWorkspaceUser = async (userId, currentStatus) => {
    setError("");
    setSuccess("");

    try {
      await updateUserStatus(userId, !currentStatus);
      await reloadProjectAwareState();
      setSuccess("User status updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status.");
    }
  };

  const renderField = (field) => {
    const value = settingsState?.[field.key];
    const commonProps = {
      id: field.key,
      name: field.key,
    };

    if (field.type === "toggle") {
      return (
        <label className="settings-toggle" htmlFor={field.key}>
          <input
            {...commonProps}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handleFieldChange(field.key, event.target.checked)}
          />
          <span className="settings-toggle-switch" />
          <span className="settings-toggle-copy">{field.label}</span>
        </label>
      );
    }

    if (field.type === "segmented") {
      return (
        <div className="settings-segmented" role="group" aria-label={field.label}>
          {field.options.map((option) => (
            <button
              key={option}
              type="button"
              className={`settings-segment${value === option ? " active" : ""}`}
              onClick={() => handleFieldChange(field.key, option)}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <select
          {...commonProps}
          value={value}
          onChange={(event) => handleFieldChange(field.key, event.target.value)}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          {...commonProps}
          className="text-area settings-text-area"
          rows={field.rows || 4}
          value={value}
          placeholder={field.placeholder || ""}
          onChange={(event) => handleFieldChange(field.key, event.target.value)}
        />
      );
    }

    if (field.type === "file") {
      const previewKey =
        field.key === "profilePhotoName" ? "profilePhotoPreview" : field.key === "logoName" ? "logoPreview" : "";
      const previewValue = previewKey ? settingsState?.[previewKey] : "";

      return (
        <div className="settings-file-field">
          <label className="settings-upload-btn" htmlFor={field.key}>
            Choose file
          </label>
          <input
            {...commonProps}
            className="settings-file-input"
            type="file"
            onChange={(event) => handleFileChange(field.key, event)}
          />
          <span className="settings-file-name">{value || "No file selected"}</span>
          {previewValue ? (
            <div className="settings-avatar-preview">
              <img src={previewValue} alt={field.label} />
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <input
        {...commonProps}
        type={field.type || "text"}
        value={value ?? field.fallback ?? ""}
        step={field.step}
        placeholder={field.placeholder || ""}
        onChange={(event) => handleFieldChange(field.key, event.target.value)}
      />
    );
  };

  const renderCollection = (collection) => {
    const items = settingsState?.[collection.key];
    const columns = getCollectionColumns(items, collection.type);
    const draft = collectionDrafts[collection.key] || buildDraftForCollection(collection, items);

    if (collection.type === "tags") {
      return (
        <div className="settings-day-grid">
          {items.map((day, index) => (
            <button
              key={day.label}
              type="button"
              className={`settings-day-chip${day.active ? " active" : ""}`}
              onClick={() => handleToggleTag(collection.key, index)}
            >
              {day.label}
            </button>
          ))}
        </div>
      );
    }

    if (collection.type === "pipeline") {
      return (
        <>
          <div className="settings-inline-form">
            {columns.map((column) => (
              <input
                key={`${collection.key}-${column}`}
                value={draft[column] || ""}
                placeholder={toSentenceCase(column)}
                onChange={(event) =>
                  handleDraftChange(collection.key, column, event.target.value)
                }
              />
            ))}
            <button type="button" onClick={() => handleAddCollectionItem(collection)}>
              Add stage
            </button>
          </div>
          <div className="settings-pipeline">
            {items.map((item, index) => (
              <div key={`${item.title}-${index}`} className="settings-pipeline-stage">
                <div className="settings-pipeline-index">{index + 1}</div>
                <div className="settings-pipeline-copy">
                  <h4>{item.title}</h4>
                  <p>{item.meta}</p>
                </div>
                <button
                  type="button"
                  className="secondary-btn settings-inline-delete"
                  onClick={() => handleDeleteCollectionItem(collection.key, index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (collection.type === "meter-list") {
      return (
        <div className="settings-meter-list">
          {items.map((item) => {
            const percent = formatPercent(item.used, item.limit);
            return (
              <div key={item.title} className="settings-meter-card">
                <div className="settings-meter-head">
                  <strong>{item.title}</strong>
                  <span>
                    {item.used.toLocaleString()} / {item.limit.toLocaleString()}
                  </span>
                </div>
                <div className="settings-meter-track">
                  <div className="settings-meter-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (collection.type === "storage-meter") {
      const used = Number(settingsState.storageUsedGb);
      const limit = Number(settingsState.storageLimitGb);
      const percent = formatPercent(used, limit);

      return (
        <div className="settings-storage-card">
          <div className="settings-storage-top">
            <div>
              <h4>Storage Usage</h4>
              <p>{used} GB of {limit} GB in use</p>
            </div>
            <span className="badge">{percent}% used</span>
          </div>
          <div className="settings-meter-track large">
            <div className="settings-meter-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="settings-storage-grid">
            <div className="stat-card">
              <h3>Files</h3>
              <p>{settingsState.storageFileCount || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Largest Module</h3>
              <p>{settingsState.storageLargestModule || "-"}</p>
            </div>
            <div className="stat-card">
              <h3>Upload Cap</h3>
              <p>{settingsState.fileSizeLimitMb} MB</p>
            </div>
          </div>
        </div>
      );
    }

    if (collection.type === "table") {
      return (
        <>
          {collection.readOnly ? null : (
            <div className="settings-inline-form settings-inline-form-table">
              {columns.map((column) => (
                <input
                  key={`${collection.key}-${column}`}
                  value={draft[column] || ""}
                  placeholder={toSentenceCase(column)}
                  onChange={(event) =>
                    handleDraftChange(collection.key, column, event.target.value)
                  }
                />
              ))}
              <button type="button" onClick={() => handleAddCollectionItem(collection)}>
                Add record
              </button>
            </div>
          )}
          <div className="table-wrap settings-table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column}>{toSentenceCase(column)}</th>
                  ))}
                  {collection.readOnly ? null : <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={`${collection.key}-${index}`}>
                    {columns.map((column) => (
                      <td key={column}>{row[column]}</td>
                    ))}
                    {collection.readOnly ? null : (
                      <td>
                        <button
                          type="button"
                          className="secondary-btn settings-inline-delete"
                          onClick={() => handleDeleteCollectionItem(collection.key, index)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    return (
      <>
        {collection.readOnly ? null : (
          <div className="settings-inline-form">
            {columns.map((column) => (
              <input
                key={`${collection.key}-${column}`}
                value={draft[column] || ""}
                placeholder={toSentenceCase(column)}
                onChange={(event) => handleDraftChange(collection.key, column, event.target.value)}
              />
            ))}
            <button type="button" onClick={() => handleAddCollectionItem(collection)}>
              Add item
            </button>
          </div>
        )}
        <div className="list-wrap large-list settings-collection-list">
          {items.map((item, index) => (
            <div key={`${item.title || item.name}-${index}`} className="list-item polished-item settings-list-item">
              <div>
                <strong>{item.title || item.name || item.date || `Entry ${index + 1}`}</strong>
                <p>{item.meta || item.scope || item.role || item.action || item.status || "-"}</p>
              </div>
              <div className="settings-item-actions">
                {item.status ? <span className="badge">{item.status}</span> : null}
                {collection.readOnly ? null : (
                  <button
                    type="button"
                    className="secondary-btn settings-inline-delete"
                    onClick={() => handleDeleteCollectionItem(collection.key, index)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderSpecialPanel = () => {
    if (activeItemId === "portal-users") {
      const portalUsers = settingsState.portalUsers || [];

      return (
        <section className="panel-card settings-group-card">
          <div className="panel-head">
            <h2>Portal Users</h2>
            <span className="badge">{portalUsers.length} Internal users</span>
          </div>
          <p>Create employees and managers with the same backend flow used elsewhere in the project.</p>
          <form className="project-form-grid two-col settings-form-grid" onSubmit={handleCreatePortalUser}>
            <div className="project-form-row">
              <label>Name</label>
              <input value={portalUserForm.name} onChange={(event) => setPortalUserForm((prev) => ({ ...prev, name: event.target.value }))} required />
            </div>
            <div className="project-form-row">
              <label>Username</label>
              <input value={portalUserForm.username} onChange={(event) => setPortalUserForm((prev) => ({ ...prev, username: event.target.value }))} required />
            </div>
            <div className="project-form-row">
              <label>Email</label>
              <input type="email" value={portalUserForm.email} onChange={(event) => setPortalUserForm((prev) => ({ ...prev, email: event.target.value }))} required />
            </div>
            <div className="project-form-row">
              <label>Password</label>
              <input type="password" value={portalUserForm.password} onChange={(event) => setPortalUserForm((prev) => ({ ...prev, password: event.target.value }))} required />
            </div>
            <div className="project-form-row">
              <label>Role</label>
              <select value={portalUserForm.role_name} onChange={(event) => setPortalUserForm((prev) => ({ ...prev, role_name: event.target.value }))}>
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <div className="project-form-row">
              <label>Hourly rate</label>
              <input type="number" min="0" step="0.01" value={portalUserForm.hourly_rate} onChange={(event) => setPortalUserForm((prev) => ({ ...prev, hourly_rate: event.target.value }))} />
            </div>
            <div className="settings-field-full form-actions">
              <button type="submit">Create portal user</button>
            </div>
          </form>

          <div className="list-wrap large-list settings-collection-list">
            {portalUsers.map((entry) => (
              <div key={entry.id} className="list-item polished-item settings-list-item">
                <div>
                  <strong>{entry.name}</strong>
                  <p>{entry.role} · {entry.scope}</p>
                </div>
                <div className="settings-item-actions">
                  <span className="badge">{entry.status}</span>
                  {entry.role === "Admin" ? null : (
                    <button
                      type="button"
                      className="secondary-btn settings-inline-delete"
                      onClick={() => handleToggleWorkspaceUser(entry.id, entry.status === "Active")}
                    >
                      {entry.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeItemId === "client-users") {
      const clientUsers = settingsState.clientUsers || [];

      return (
        <section className="panel-card settings-group-card">
          <div className="panel-head">
            <h2>Client Users</h2>
            <span className="badge">{clientUsers.length} External users</span>
          </div>
          <p>Create external logins against the existing client profiles already stored in this project.</p>
          <form className="project-form-grid two-col settings-form-grid" onSubmit={handleCreateClientUser}>
            <div className="project-form-row">
              <label>Name</label>
              <input value={clientUserForm.name} onChange={(event) => setClientUserForm((prev) => ({ ...prev, name: event.target.value }))} required />
            </div>
            <div className="project-form-row">
              <label>Username</label>
              <input value={clientUserForm.username} onChange={(event) => setClientUserForm((prev) => ({ ...prev, username: event.target.value }))} required />
            </div>
            <div className="project-form-row">
              <label>Email</label>
              <input type="email" value={clientUserForm.email} onChange={(event) => setClientUserForm((prev) => ({ ...prev, email: event.target.value }))} required />
            </div>
            <div className="project-form-row">
              <label>Password</label>
              <input type="password" value={clientUserForm.password} onChange={(event) => setClientUserForm((prev) => ({ ...prev, password: event.target.value }))} required />
            </div>
            <div className="project-form-row settings-field-full">
              <label>Linked client profile</label>
              <select value={clientUserForm.clientId} onChange={(event) => setClientUserForm((prev) => ({ ...prev, clientId: event.target.value }))} required>
                <option value="">Select client</option>
                {referenceData.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.client_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-field-full form-actions">
              <button type="submit">Create client user</button>
            </div>
          </form>

          <div className="list-wrap large-list settings-collection-list">
            {clientUsers.map((entry) => (
              <div key={entry.id} className="list-item polished-item settings-list-item">
                <div>
                  <strong>{entry.name}</strong>
                  <p>{entry.scope}</p>
                </div>
                <div className="settings-item-actions">
                  <span className="badge">{entry.status}</span>
                  <button
                    type="button"
                    className="secondary-btn settings-inline-delete"
                    onClick={() => handleToggleWorkspaceUser(entry.id, entry.status === "Active")}
                  >
                    {entry.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeItemId === "teams") {
      const teams = settingsState.teams || [];

      return (
        <section className="panel-card settings-group-card">
          <div className="panel-head">
            <h2>Teams</h2>
            <span className="badge">{teams.length} Team workspaces</span>
          </div>
          <p>Teams are mapped to the project-group structure already used by the projects module.</p>
          <form className="project-form-grid two-col settings-form-grid" onSubmit={handleCreateTeam}>
            <div className="project-form-row">
              <label>Team name</label>
              <input value={teamForm.name} onChange={(event) => setTeamForm((prev) => ({ ...prev, name: event.target.value }))} required />
            </div>
            <div className="project-form-row">
              <label>Team code</label>
              <input value={teamForm.code} onChange={(event) => setTeamForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))} required />
            </div>
            <div className="settings-field-full form-actions">
              <button type="submit">Create team</button>
            </div>
          </form>

          <div className="list-wrap large-list settings-collection-list">
            {teams.map((entry) => (
              <div key={entry.id || entry.title} className="list-item polished-item settings-list-item">
                <div>
                  <strong>{entry.title}</strong>
                  <p>{entry.meta}</p>
                </div>
                <span className="badge">{entry.status}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeItemId === "roles") {
      return (
        <section className="panel-card settings-group-card">
          <div className="panel-head">
            <h2>Roles</h2>
            <span className="badge">{referenceData.roles.length} Live roles</span>
          </div>
          <p>These are the actual application roles returned by the backend. User assignment is currently supported for Employee, Manager, and Client flows.</p>
          <div className="settings-pipeline">
            {(settingsState.rolesHierarchy || []).map((entry, index) => (
              <div key={`${entry.title}-${index}`} className="settings-pipeline-stage">
                <div className="settings-pipeline-index">{index + 1}</div>
                <div className="settings-pipeline-copy">
                  <h4>{entry.title}</h4>
                  <p>{entry.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  if (isLoading || !settingsState) {
    return (
      <main className="auth-layout">
        <section className="auth-card">
          <h2>Loading setup module...</h2>
        </section>
      </main>
    );
  }

  return (
    <WorkspaceLayout
      role={user?.role}
      title="Setup"
      subtitle={`Tenant controls and personal settings for ${user?.name || "your workspace"}`}
      onLogout={handleLogout}
      activeSection="Settings"
    >
      <div className="admin-hero settings-hero">
        <div className="admin-hero-main">
          <h2>Setup / Settings Module</h2>
          <p>Enterprise-grade control center with personal settings, portal controls, automation, data admin, and RBAC-ready user management.</p>
        </div>
        <div className="admin-hero-meta">
          <span className="status-pill">Zoho-style setup</span>
          <span className="status-pill subtle">Multi-tenant ready</span>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <section className="home-kpi-row">
        <article className="kpi-card blue">
          <p className="kpi-value">{totalSections}</p>
          <p className="kpi-label">Settings Sections</p>
        </article>
        <article className="kpi-card cyan">
          <p className="kpi-value">{totalModules}</p>
          <p className="kpi-label">Modules</p>
        </article>
        <article className="kpi-card indigo">
          <p className="kpi-value">{fieldCount}</p>
          <p className="kpi-label">Form Controls</p>
        </article>
        <article className="kpi-card violet">
          <p className="kpi-value">{collectionItemCount}</p>
          <p className="kpi-label">Manual Records</p>
        </article>
        <article className="kpi-card peach">
          <p className="kpi-value">{settingsState.storageUsedGb} GB</p>
          <p className="kpi-label">Storage Used</p>
        </article>
        <article className="kpi-card rose">
          <p className="kpi-value">{notificationsUnreadCount}</p>
          <p className="kpi-label">Unread Alerts</p>
        </article>
      </section>

      <section className="settings-shell">
        <aside className={`settings-sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
          <div className="settings-sidebar-head">
            <div>
              <h3>Categories</h3>
              <p>{visibleSections.reduce((count, section) => count + section.items.length, 0)} modules</p>
            </div>
            <button
              type="button"
              className="secondary-btn settings-collapse-btn"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              {sidebarCollapsed ? "Expand" : "Collapse"}
            </button>
          </div>

          <div className="settings-sidebar-search">
            <input
              type="search"
              placeholder="Search settings"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="settings-sidebar-sections">
            {visibleSections.length === 0 ? (
              <p className="settings-empty-state">No settings matched your search.</p>
            ) : null}

            {visibleSections.map((section) => (
              <div key={section.id} className="settings-nav-section">
                <div className="settings-nav-section-title" title={section.label}>
                  {sidebarCollapsed ? section.label.slice(0, 2).toUpperCase() : section.label}
                </div>
                <div className="settings-nav-items">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      className={`settings-nav-item${activeItemId === item.id ? " active" : ""}`}
                      onClick={() => setActiveItemId(item.id)}
                    >
                      <span className="settings-nav-dot" />
                      {!sidebarCollapsed ? <span>{item.label}</span> : <span className="settings-nav-short">{item.label.slice(0, 1)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="settings-panel">
          <section className="panel-card settings-context-card">
            <div className="panel-head">
              <h2>Module Summary</h2>
              <span className="badge">{activePanel?.badge}</span>
            </div>
            <div className="settings-summary-grid">
              <div className="list-item polished-item">
                <span>
                  <strong>Scope</strong>
                  <br />
                  {activePanel?.category}
                </span>
                <span>{user?.role}</span>
              </div>
              <div className="list-item polished-item">
                <span>
                  <strong>Configured Items</strong>
                  <br />
                  {formatModuleCount(collectionItemCount, "record")}
                </span>
                <span>{fieldCount} controls</span>
              </div>
              <div className="list-item polished-item">
                <span>
                  <strong>Persistence</strong>
                  <br />
                  Billing API plus tenant-local setup state
                </span>
                <span>Synced</span>
              </div>
              <div className="list-item polished-item">
                <span>
                  <strong>Workspace Context</strong>
                  <br />
                  {referenceData.organizations[0]?.name || settingsState.organizationName}
                </span>
                <span>{notificationsUnreadCount} unread</span>
              </div>
            </div>
          </section>

          <header className="settings-panel-head">
            <div>
              <p className="settings-panel-kicker">{activePanel?.category}</p>
              <div className="settings-panel-title-row">
                <h2>{activePanel?.title}</h2>
                <span className="badge">{activePanel?.badge}</span>
              </div>
              <p className="settings-panel-copy">{activePanel?.description}</p>
            </div>
            <div className="settings-panel-actions">
              <button type="button" className="secondary-btn" onClick={handleResetPanel}>
                Reset panel
              </button>
              <button type="button" onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </header>

          {activePanel?.stats?.length ? (
            <div className="stat-grid settings-stat-grid">
              {activePanel.stats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <h3>{stat.label}</h3>
                  <p>{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="settings-role-strip">
            <span className="settings-role-label">Visible to</span>
            <div className="settings-role-chips">
              <span className="task-summary-chip success">{user?.role}</span>
              <span className="task-summary-chip neutral">RBAC governed</span>
              <span className="task-summary-chip neutral">API-first sync</span>
            </div>
          </div>

          {(activePanel?.groups || []).map((group) => (
            <section key={group.title} className="panel-card settings-group-card">
              <div className="panel-head">
                <h2>{group.title}</h2>
              </div>
              <div className="project-form-grid two-col settings-form-grid">
                {group.fields.map((field) => (
                  <div
                    key={field.key}
                    className={`project-form-row${field.type === "textarea" || field.type === "file" || field.type === "toggle" ? " full settings-field-full" : ""}`}
                  >
                    {field.type !== "toggle" ? <label htmlFor={field.key}>{field.label}</label> : null}
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {specialPanelIds.includes(activeItemId)
            ? renderSpecialPanel()
            : (activePanel?.collections || []).map((collection) => (
                <section key={collection.key} className="panel-card settings-group-card">
                  <div className="panel-head">
                    <h2>{collection.title}</h2>
                  </div>
                  {renderCollection(collection)}
                </section>
              ))}
        </div>
      </section>
    </WorkspaceLayout>
  );
}

export default Settings;
