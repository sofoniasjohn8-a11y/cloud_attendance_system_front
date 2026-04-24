import { API_ENDPOINTS } from '../constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const request = async (method, path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

// Offices
export const getOffices = () => request('GET', API_ENDPOINTS.OFFICES);
export const getOffice = (id) => request('GET', `${API_ENDPOINTS.OFFICES}/${id}`);
export const createOffice = (data) => request('POST', API_ENDPOINTS.OFFICES, data);
export const updateOffice = (id, data) => request('PUT', `${API_ENDPOINTS.OFFICES}/${id}`, data);
export const deleteOffice = (id) => request('DELETE', `${API_ENDPOINTS.OFFICES}/${id}`);

// Attendances
export const getAttendances = () => request('GET', API_ENDPOINTS.ATTENDANCES);
export const getAttendance = (id) => request('GET', `${API_ENDPOINTS.ATTENDANCES}/${id}`);
export const clockIn = (latitude, longitude) =>
  request('POST', API_ENDPOINTS.ATTENDANCES, { latitude, longitude });
export const clockOut = (id, latitude, longitude) =>
  request('PUT', `${API_ENDPOINTS.ATTENDANCES}/${id}`, { latitude, longitude });
export const deleteAttendance = (id) => request('DELETE', `${API_ENDPOINTS.ATTENDANCES}/${id}`);

// Schedules
export const getSchedules = () => request('GET', API_ENDPOINTS.SCHEDULES);
export const getSchedule = (id) => request('GET', `${API_ENDPOINTS.SCHEDULES}/${id}`);
export const createSchedule = (data) => request('POST', API_ENDPOINTS.SCHEDULES, data);
export const updateSchedule = (id, data) => request('PUT', `${API_ENDPOINTS.SCHEDULES}/${id}`, data);
export const deleteSchedule = (id) => request('DELETE', `${API_ENDPOINTS.SCHEDULES}/${id}`);

// Reports
export const getMonthlyReport = (params) => {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  return request('GET', `${API_ENDPOINTS.REPORTS_MONTHLY}${query}`);
};
