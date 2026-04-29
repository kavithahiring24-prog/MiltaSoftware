import api from "./http";

export async function getClientPortalDashboard() {
  const response = await api.get("/clients/dashboard");
  return response.data;
}

export async function payClientInvoice(invoiceId) {
  const response = await api.post(`/clients/invoices/${invoiceId}/pay`);
  return response.data;
}
