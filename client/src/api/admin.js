import api from "./http";

export async function getAdminStats() {
  const response = await api.get("/admin/stats");
  return response.data;
}

export async function getInvoiceSettings() {
  const response = await api.get("/admin/invoice-settings");
  return response.data;
}

export async function updateInvoiceSettings(input) {
  const response = await api.put("/admin/invoice-settings", input);
  return response.data;
}

export async function getApprovalPanel() {
  const response = await api.get("/admin/approvals");
  return response.data;
}

export async function getInvoicePreview(params) {
  const response = await api.get("/admin/invoice-preview", { params: params || {} });
  return response.data;
}

export async function generateInvoices() {
  const response = await api.post("/admin/invoices/generate");
  return response.data;
}

export async function getAdminInvoices() {
  const response = await api.get("/admin/invoices");
  return response.data;
}

export async function sendTestEmail() {
  const response = await api.post("/admin/test-email");
  return response.data;
}

export async function triggerTestReminders() {
  const response = await api.post("/admin/test-reminders");
  return response.data;
}
