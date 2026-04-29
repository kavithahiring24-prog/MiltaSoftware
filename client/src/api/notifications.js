import api from "./http";

export async function getMyNotifications() {
  const response = await api.get("/notifications");
  return response.data;
}

export async function getUnreadCount() {
  const response = await api.get("/notifications/unread");
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch("/notifications/read-all");
  return response.data;
}

export async function deleteNotificationById(id) {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
}
