import api from "./http";

export async function globalSearch(q) {
  const response = await api.get("/search", { params: { q } });
  return response.data;
}
