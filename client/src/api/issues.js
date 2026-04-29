import api from "./http";

export async function getIssues() {
  const response = await api.get("/issues");
  return response.data;
}

export async function createIssue(input) {
  const response = await api.post("/issues", input);
  return response.data;
}

export async function updateIssue(id, input) {
  const response = await api.patch(`/issues/${id}`, input);
  return response.data;
}

export async function deleteIssue(id) {
  const response = await api.delete(`/issues/${id}`);
  return response.data;
}
