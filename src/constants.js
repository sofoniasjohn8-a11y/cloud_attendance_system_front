/**
 * Constants and Configuration
 */

// Time formatting options
export const TIME_FORMAT_OPTIONS = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

export const DATE_FORMAT_OPTIONS = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

// Attendance types
export const ATTENDANCE_TYPES = {
  CLOCK_IN: 'clock_in',
  CLOCK_OUT: 'clock_out',
};

// Status indicators
export const STATUS = {
  IN_RANGE: 'In Range',
  OUT_OF_RANGE: 'Out of Range',
  CLOCKED_IN: 'CLOCKED IN',
  CLOCKED_OUT: 'CLOCKED OUT',
};

// Error messages
export const ERROR_MESSAGES = {
  OUT_OF_RANGE: 'You are out of office range. Cannot clock in.',
  LOCATION_DENIED: 'Location permission denied. Please enable location access.',
  LOCATION_UNAVAILABLE: 'Location information is unavailable.',
  API_ERROR: 'Failed to update attendance. Please try again.',
  FETCH_ERROR: 'Failed to fetch data. Please try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  CLOCK_IN: 'Successfully clocked in!',
  CLOCK_OUT: 'Successfully clocked out!',
};

// Default configuration
export const DEFAULT_CONFIG = {
  GEOFENCE_RADIUS: 100, // meters
  LOCATION_UPDATE_INTERVAL: 5000, // milliseconds
  API_TIMEOUT: 10000, // milliseconds
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // milliseconds
};

// API endpoints
export const API_ENDPOINTS = {
  REGISTER: '/register',
  LOGIN: '/login',
  LOGOUT: '/logout',
  ME: '/me',
  OFFICES: '/offices',
  ATTENDANCES: '/attendances',
  SCHEDULES: '/schedules',
  REPORTS_MONTHLY: '/reports/monthly',
  ADMIN_USERS: '/admin/users',
  ADMIN_USERS_BY_OFFICE: '/admin/users/by-office',
  ADMIN_OVERVIEW: '/admin/overview',
  ADMIN_CALENDAR: '/admin/calendar',
  ADMIN_NOTIFY_ABSENT: '/admin/notify/absent',
  ADMIN_NOTIFY_ABSENT_ALL: '/admin/notify/absent-all',
  ADMIN_ATTENDANCES: '/admin/attendances',
};

// Color themes
export const COLORS = {
  PRIMARY: 'primary-600',
  SUCCESS: 'success-600',
  DANGER: 'danger-600',
  WARNING: 'yellow-600',
  INFO: 'blue-600',
};

// Button states
export const BUTTON_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  DISABLED: 'disabled',
};

export default {
  TIME_FORMAT_OPTIONS,
  DATE_FORMAT_OPTIONS,
  ATTENDANCE_TYPES,
  STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_CONFIG,
  API_ENDPOINTS,
  COLORS,
  BUTTON_STATES,
};
