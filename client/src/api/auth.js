import api from "./http";
import { saveAuth } from "./authStorage";

export async function signup(input) {
  const response = await api.post("/auth/signup", input);
  saveAuth(response.data);
  return response.data;
}

export async function login(input) {
  const response = await api.post("/auth/login", input);
  saveAuth(response.data);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data.user;
}

export async function forgotPassword(email) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(token, newPassword) {
  const response = await api.post("/auth/reset-password", { token, newPassword });
  return response.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await api.patch("/auth/change-password", { currentPassword, newPassword });
  return response.data;
}

export async function updateProfile(data) {
  const response = await api.patch("/auth/profile", data);
  return response.data;
}
