import api from "./http";

export async function getRoles() {
  const response = await api.get("/roles");
  return response.data;
}

export async function createRole(input) {
  const response = await api.post("/roles", input);
  return response.data;
}
