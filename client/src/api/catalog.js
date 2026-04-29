import api from "./http";

export async function getClients() {
  const response = await api.get("/clients");
  return response.data;
}

export async function createClient(input) {
  const response = await api.post("/clients", input);
  return response.data;
}

export async function deleteClient(id) {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
}

export async function getCategories() {
  const response = await api.get("/categories");
  return response.data;
}

export async function createCategory(input) {
  const response = await api.post("/categories", input);
  return response.data;
}

export async function deleteCategory(id) {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
}
