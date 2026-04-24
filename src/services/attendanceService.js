/**
 * Attendance API Service
 * Service for communicating with the Laravel backend
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Clock In/Clock Out Request
 * @param {Object} data - Attendance data
 * @param {string} data.type - 'clock_in' or 'clock_out'
 * @param {Date} data.timestamp - Timestamp of the action
 * @param {number} data.lat - User's latitude
 * @param {number} data.lng - User's longitude
 * @returns {Promise<Object>} API response
 */
export const toggleAttendance = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // If using token auth
      },
      body: JSON.stringify({
        type: data.type,
        timestamp: data.timestamp.toISOString(),
        latitude: data.lat,
        longitude: data.lng,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update attendance');
    }

    return await response.json();
  } catch (error) {
    console.error('Attendance API Error:', error);
    throw error;
  }
};

/**
 * Fetch Today's Attendance Log
 * @returns {Promise<Array>} Array of attendance records
 */
export const getTodayAttendance = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/today`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch attendance records');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch Attendance Error:', error);
    throw error;
  }
};

/**
 * Fetch Attendance History for a Specific Date Range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of attendance records
 */
export const getAttendanceHistory = async (startDate, endDate) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/attendance/history?start_date=${startDate}&end_date=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch attendance history');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch History Error:', error);
    throw error;
  }
};

/**
 * Update Attendance Remarks
 * @param {number} attendanceId - ID of the attendance record
 * @param {string} remarks - Remarks text
 * @returns {Promise<Object>} Updated attendance record
 */
export const updateAttendanceRemarks = async (attendanceId, remarks) => {
  try {
    const response = await fetch(`${API_BASE_URL}/attendance/${attendanceId}/remarks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({ remarks }),
    });

    if (!response.ok) {
      throw new Error('Failed to update remarks');
    }

    return await response.json();
  } catch (error) {
    console.error('Update Remarks Error:', error);
    throw error;
  }
};

/**
 * Get Office Geofence Details
 * @returns {Promise<Object>} Office location and geofence radius
 */
export const getOfficeGeofence = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/office/geofence`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch office geofence details');
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch Geofence Error:', error);
    throw error;
  }
};

/**
 * Report Location with Timestamp (for audit trail)
 * @param {number} lat - User's latitude
 * @param {number} lng - User's longitude
 * @returns {Promise<Object>} Location log response
 */
export const reportLocation = async (lat, lng) => {
  try {
    const response = await fetch(`${API_BASE_URL}/location/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to report location');
    }

    return await response.json();
  } catch (error) {
    console.error('Report Location Error:', error);
    throw error;
  }
};

export default {
  toggleAttendance,
  getTodayAttendance,
  getAttendanceHistory,
  updateAttendanceRemarks,
  getOfficeGeofence,
  reportLocation,
};
