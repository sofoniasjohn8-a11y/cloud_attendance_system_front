import React, { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { toggleAttendance, getTodayAttendance } from '../services/attendanceService';
import { formatTime, formatDate, formatCoordinates } from '../utils';
import {
  ATTENDANCE_TYPES,
  STATUS,
  ERROR_MESSAGES,
} from '../constants';

/**
 * Enhanced AttendanceUI Component with Real API Integration
 * This is an example of how to use the API service
 */
const AttendanceUIEnhanced = () => {
  // Configuration
  const OFFICE_LATITUDE = 40.7128;
  const OFFICE_LONGITUDE = -74.0060;
  const GEOFENCE_RADIUS = 100;

  // State Management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Get geolocation data
  const {
    lat,
    lng,
    isLoading: locationLoading,
    error: locationError,
    isWithinOffice,
  } = useGeolocation(OFFICE_LATITUDE, OFFICE_LONGITUDE, GEOFENCE_RADIUS);

  // Real-time Clock Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load attendance log on mount and periodically
  useEffect(() => {
    const loadAttendanceLog = async () => {
      try {
        const response = await getTodayAttendance();
        if (response && response.data) {
          setAttendanceLog(response.data);

          // Check if currently clocked in
          const lastEntry = response.data[response.data.length - 1];
          if (lastEntry && lastEntry.type === ATTENDANCE_TYPES.CLOCK_IN) {
            setIsClockedIn(true);
          }
        }
      } catch (error) {
        console.error('Failed to load attendance log:', error);
        // Fall back to localStorage
        const today = new Date().toDateString();
        const storedLog = localStorage.getItem(`attendance_${today}`);
        if (storedLog) {
          setAttendanceLog(JSON.parse(storedLog));
        }
      }
    };

    loadAttendanceLog();

    // Refresh every 5 minutes
    const interval = setInterval(loadAttendanceLog, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Clock In/Out with Real API
  const handleClockToggle = async () => {
    if (!isWithinOffice && !isClockedIn) {
      setErrorMessage(ERROR_MESSAGES.OUT_OF_RANGE);
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const timestamp = new Date();

      // Call actual API
      const response = await toggleAttendance({
        type: isClockedIn ? ATTENDANCE_TYPES.CLOCK_OUT : ATTENDANCE_TYPES.CLOCK_IN,
        timestamp,
        lat,
        lng,
      });

      if (response && response.success) {
        // Update local state
        const newEntry = {
          id: response.data.id,
          time: formatTime(timestamp),
          type: isClockedIn ? 'Clock Out' : 'Clock In',
          location: formatCoordinates(lat, lng),
          status: 'Completed',
          timestamp: response.data.timestamp,
        };

        setAttendanceLog([...attendanceLog, newEntry]);
        setIsClockedIn(!isClockedIn);

        // Show success message
        const message = isClockedIn
          ? 'Successfully clocked out!'
          : 'Successfully clocked in!';
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);

        // Save to localStorage as backup
        const today = new Date().toDateString();
        localStorage.setItem(`attendance_${today}`, JSON.stringify([...attendanceLog, newEntry]));
      }
    } catch (error) {
      const errorMsg = error.message || ERROR_MESSAGES.API_ERROR;
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 4000);
      console.error('Attendance toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Main Container */}
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Attendance System
          </h1>
          <p className="text-gray-600">Cloud-based Time Tracking</p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-enterprise-lg overflow-hidden">
          {/* Top Status Bar */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Current Status</span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isClockedIn
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {isClockedIn ? STATUS.CLOCKED_IN : STATUS.CLOCKED_OUT}
              </div>
            </div>
          </div>

          {/* Real-time Clock Section */}
          <div className="p-8 text-center border-b border-gray-200">
            <div className="text-6xl md:text-7xl font-bold text-primary-700 font-mono mb-2">
              {formatTime(currentTime)}
            </div>
            <p className="text-gray-600 text-sm">{formatDate(currentTime)}</p>
          </div>

          {/* Geofencing Status */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                  isWithinOffice
                    ? 'bg-success-50 border border-success-200'
                    : 'bg-danger-50 border border-danger-200'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    isWithinOffice ? 'bg-success-500' : 'bg-danger-500'
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    isWithinOffice ? 'text-success-700' : 'text-danger-700'
                  }`}
                >
                  {isWithinOffice ? STATUS.IN_RANGE : STATUS.OUT_OF_RANGE}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {locationLoading
                      ? 'Detecting location...'
                      : lat && lng
                      ? formatCoordinates(lat, lng)
                      : 'Location not available'}
                  </span>
                </div>
              </div>
            </div>
            {locationError && (
              <div className="mt-3 flex items-start gap-2 bg-danger-50 border border-danger-200 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-danger-700">{locationError}</p>
              </div>
            )}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-6 bg-success-50 border-b border-success-200 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
              <p className="text-success-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-6 bg-danger-50 border-b border-danger-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
              <p className="text-danger-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Main Action Button */}
          <div className="p-8 text-center">
            <button
              onClick={handleClockToggle}
              disabled={
                isLoading ||
                locationLoading ||
                (!isWithinOffice && !isClockedIn) ||
                locationError
              }
              className={`
                w-full md:w-96 px-8 py-4 rounded-xl font-bold text-lg
                transition-all duration-200 flex items-center justify-center gap-3
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isClockedIn
                    ? 'bg-danger-600 hover:bg-danger-700 text-white disabled:hover:bg-danger-600'
                    : 'bg-success-600 hover:bg-success-700 text-white disabled:hover:bg-success-600'
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : isClockedIn ? (
                <>
                  <LogOut className="w-5 h-5" />
                  Clock Out
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Clock In
                </>
              )}
            </button>
            {!isWithinOffice && !isClockedIn && (
              <p className="mt-3 text-sm text-danger-600">
                You must be within office range to clock in
              </p>
            )}
          </div>

          {/* Attendance Log Section */}
          <div className="border-t border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary-600" />
              Today's Activity
            </h2>

            {attendanceLog.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No activity recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">
                        Time
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">
                        Location
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLog.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4 text-gray-800 font-mono text-sm">
                          {entry.time}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              entry.type === 'Clock In'
                                ? 'bg-success-100 text-success-700'
                                : 'bg-danger-100 text-danger-700'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-sm font-mono">
                          {entry.location}
                        </td>
                        <td className="py-4 px-4">
                          <span className="flex items-center gap-1 text-success-700 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Your location and attendance data are securely stored and transmitted to our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceUIEnhanced;
