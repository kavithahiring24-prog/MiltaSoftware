import api from "./http";

export async function getOrganizations() {
  const response = await api.get("/organizations");
  return response.data;
}

export async function getOrganizationById(id) {
  const response = await api.get(`/organizations/${id}`);
  return response.data;
}

export async function createOrganization(data) {
  const response = await api.post("/organizations", data);
  return response.data;
}

export async function updateOrganization(id, data) {
  const response = await api.patch(`/organizations/${id}`, data);
  return response.data;
}

export async function deleteOrganization(id) {
  const response = await api.delete(`/organizations/${id}`);
  return response.data;
}

export async function assignOrgMember(orgId, userId) {
  const response = await api.post(`/organizations/${orgId}/members`, { userId });
  return response.data;
}

export async function removeOrgMember(orgId, userId) {
  const response = await api.delete(`/organizations/${orgId}/members/${userId}`);
  return response.data;
}
