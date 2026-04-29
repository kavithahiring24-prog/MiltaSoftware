import api from "./http";

export async function getTaskLists(params) {
  const response = await api.get("/task-lists", { params: params || {} });
  return response.data;
}

export async function getTaskListById(id) {
  const response = await api.get(`/task-lists/${id}`);
  return response.data;
}

export async function createTaskList(data) {
  const response = await api.post("/task-lists", data);
  return response.data;
}

export async function updateTaskList(id, data) {
  const response = await api.patch(`/task-lists/${id}`, data);
  return response.data;
}

export async function deleteTaskList(id) {
  const response = await api.delete(`/task-lists/${id}`);
  return response.data;
}
