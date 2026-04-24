/**
 * Helper Utility Functions
 */

/**
 * Format time for display
 * @param {Date} date - Date object to format
 * @returns {string} Formatted time string (HH:MM:SS)
 */
export const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

/**
 * Format date for display
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - User latitude
 * @param {number} lon1 - User longitude
 * @param {number} lat2 - Office latitude
 * @param {number} lon2 - Office longitude
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if user is within geofence
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @param {number} officeLat - Office latitude
 * @param {number} officeLng - Office longitude
 * @param {number} radiusMeters - Geofence radius in meters
 * @returns {boolean} True if within geofence
 */
export const isWithinGeofence = (
  userLat,
  userLng,
  officeLat,
  officeLng,
  radiusMeters
) => {
  const distance = calculateDistance(userLat, userLng, officeLat, officeLng);
  return distance <= radiusMeters;
};

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal places (default: 4)
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (lat, lng, precision = 4) => {
  return `${lat?.toFixed(precision)}°, ${lng?.toFixed(precision)}°`;
};

/**
 * Parse ISO timestamp to readable format
 * @param {string} isoString - ISO timestamp
 * @returns {string} Readable format
 */
export const parseISOTime = (isoString) => {
  const date = new Date(isoString);
  return formatTime(date);
};

/**
 * Get time difference in human-readable format
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {string} Time difference
 */
export const getTimeDifference = (date1, date2) => {
  const diffMs = Math.abs(date2 - date1);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffMins}m`;
};

/**
 * Store data in localStorage with expiry
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {number} expiryMs - Expiry time in milliseconds
 */
export const setStorageWithExpiry = (key, value, expiryMs) => {
  const item = {
    value,
    expiry: Date.now() + expiryMs,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

/**
 * Get data from localStorage with expiry check
 * @param {string} key - Storage key
 * @returns {*} Stored value or null if expired
 */
export const getStorageWithExpiry = (key) => {
  const item = localStorage.getItem(key);
  if (!item) return null;

  const { value, expiry } = JSON.parse(item);
  if (Date.now() > expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return value;
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export default {
  formatTime,
  formatDate,
  calculateDistance,
  isWithinGeofence,
  formatCoordinates,
  parseISOTime,
  getTimeDifference,
  setStorageWithExpiry,
  getStorageWithExpiry,
  validateEmail,
  generateId,
};
