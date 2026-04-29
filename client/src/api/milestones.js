import api from "./http";

export async function getMilestones(params) {
  const response = await api.get("/milestones", { params: params || {} });
  return response.data;
}

export async function createMilestone(input) {
  const response = await api.post("/milestones", input);
  return response.data;
}

export async function updateMilestone(id, input) {
  const response = await api.patch(`/milestones/${id}`, input);
  return response.data;
}

export async function deleteMilestone(id) {
  const response = await api.delete(`/milestones/${id}`);
  return response.data;
}
