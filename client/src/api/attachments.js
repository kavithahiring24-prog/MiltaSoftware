import api from "./http";

export async function getAttachments(params) {
  const response = await api.get("/attachments", { params: params || {} });
  return response.data;
}

export async function uploadAttachment(formData) {
  const response = await api.post("/attachments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteAttachment(id) {
  const response = await api.delete(`/attachments/${id}`);
  return response.data;
}
