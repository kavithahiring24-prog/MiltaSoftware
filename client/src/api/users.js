import api from "./http";

export async function getUsers() {
  const response = await api.get("/users");
  return response.data;
}

export async function createEmployeeOrManager(input) {
  const response = await api.post("/users", input);
  return response.data;
}

export async function updateUserStatus(id, isActive) {
  const response = await api.patch(`/users/${id}/status`, { is_active: isActive });
  return response.data;
}
