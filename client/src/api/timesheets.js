import api from "./http";

export async function startTimer(payload) {
  const response = await api.post("/timesheets/start", payload);
  return response.data;
}

export async function stopTimer(timesheetId, payload) {
  const response = await api.post(`/timesheets/${timesheetId}/stop`, payload || {});
  return response.data;
}

export async function getMyTimesheets() {
  const response = await api.get("/timesheets/my");
  return response.data;
}

export async function getTimesheetSummary() {
  const response = await api.get("/timesheets/summary");
  return response.data;
}

export async function getPendingTimesheets() {
  const response = await api.get("/timesheets/pending");
  return response.data;
}

export async function reviewTimesheet(timesheetId, payload) {
  const response = await api.patch(`/timesheets/${timesheetId}/review`, payload);
  return response.data;
}
