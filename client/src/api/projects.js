import api from "./http";

export async function createProject(input) {
  const response = await api.post("/projects", input);
  return response.data;
}

export async function getProjects() {
  const response = await api.get("/projects");
  return response.data;
}

export async function getProjectGroups() {
  const response = await api.get("/project-groups");
  return response.data;
}

export async function getProjectGroupStats() {
  const response = await api.get("/project-groups/stats");
  return response.data;
}

export async function createProjectGroup(input) {
  const response = await api.post("/project-groups", input);
  return response.data;
}

export async function getProjectById(id) {
  const response = await api.get(`/projects/${id}`);
  return response.data;
}
