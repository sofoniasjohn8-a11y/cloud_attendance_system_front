import { API_ENDPOINTS } from '../constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const getToken = () => localStorage.getItem('auth_token');

const request = async (method, path, body) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const details = err.errors ? JSON.stringify(err.errors) : (err.message || `Request failed: ${res.status}`);
    throw new Error(details);
  }
  return res.status === 204 ? null : res.json();
};

// Auth
export const register = (data) => request('POST', API_ENDPOINTS.REGISTER, data);
export const login = (data) => request('POST', API_ENDPOINTS.LOGIN, data);
export const logout = () => request('POST', API_ENDPOINTS.LOGOUT);
export const getMe = () => request('GET', API_ENDPOINTS.ME);

// Offices
export const getOffices = () => request('GET', API_ENDPOINTS.OFFICES);
export const getOffice = (id) => request('GET', `${API_ENDPOINTS.OFFICES}/${id}`);
export const createOffice = (data) => request('POST', API_ENDPOINTS.OFFICES, data);
export const updateOffice = (id, data) => request('PUT', `${API_ENDPOINTS.OFFICES}/${id}`, data);
export const deleteOffice = (id) => request('DELETE', `${API_ENDPOINTS.OFFICES}/${id}`);

// Attendances
export const getAttendances = () => request('GET', API_ENDPOINTS.ATTENDANCES);
export const getAttendance = (id) => request('GET', `${API_ENDPOINTS.ATTENDANCES}/${id}`);
export const clockIn = (latitude, longitude, office_id) =>
  request('POST', API_ENDPOINTS.ATTENDANCES, { latitude, longitude, office_id });
export const clockOut = (id, latitude, longitude) => {
  const clock_out = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return request('PUT', `${API_ENDPOINTS.ATTENDANCES}/${id}`, { clock_out });
};
export const deleteAttendance = (id) => request('DELETE', `${API_ENDPOINTS.ATTENDANCES}/${id}`);

// Schedules
export const getSchedules = () => request('GET', API_ENDPOINTS.SCHEDULES);
export const getSchedule = (id) => request('GET', `${API_ENDPOINTS.SCHEDULES}/${id}`);
export const createSchedule = (data) => request('POST', API_ENDPOINTS.SCHEDULES, data);
export const updateSchedule = (id, data) => request('PUT', `${API_ENDPOINTS.SCHEDULES}/${id}`, data);
export const deleteSchedule = (id) => request('DELETE', `${API_ENDPOINTS.SCHEDULES}/${id}`);

// Admin
export const getAdminOverview = (date) => {
  const query = date ? `?date=${date}` : '';
  return request('GET', `${API_ENDPOINTS.ADMIN_OVERVIEW}${query}`);
};
export const getAdminCalendar = (month, year) =>
  request('GET', `${API_ENDPOINTS.ADMIN_CALENDAR}?month=${month}&year=${year}`);
export const getAdminUsers = () => request('GET', API_ENDPOINTS.ADMIN_USERS);
export const getAdminUser = (id) => request('GET', `${API_ENDPOINTS.ADMIN_USERS}/${id}`);
export const updateUserRole = (id, role) => request('PUT', `${API_ENDPOINTS.ADMIN_USERS}/${id}/role`, { role });
export const deleteUser = (id) => request('DELETE', `${API_ENDPOINTS.ADMIN_USERS}/${id}`);
export const overrideAttendance = (id, data) => request('PUT', `${API_ENDPOINTS.ADMIN_ATTENDANCES}/${id}`, data);
export const notifyAbsent = (user_id, date) => request('POST', API_ENDPOINTS.ADMIN_NOTIFY_ABSENT, { user_id, date });
export const notifyAbsentAll = (date) => request('POST', API_ENDPOINTS.ADMIN_NOTIFY_ABSENT_ALL, { date });

// Notifications
export const getNotifications = () => request('GET', '/notifications');
export const markNotificationRead = (id) => request('PUT', `/notifications/${id}/read`);
export const markAllNotificationsRead = () => request('PUT', '/notifications/read-all');
export const deleteNotification = (id) => request('DELETE', `/notifications/${id}`);

// Reports
export const getMonthlyReport = (params) => {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  return request('GET', `${API_ENDPOINTS.REPORTS_MONTHLY}${query}`);
};
