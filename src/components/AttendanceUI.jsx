import React, { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation';
import { getOffices, getAttendances, clockIn, clockOut, logout } from '../services/attendanceService';
import { DEFAULT_CONFIG } from '../constants';
import NotificationBell from './NotificationBell';

const AttendanceUI = () => {
  const [officeConfig, setOfficeConfig] = useState({
    id: null,
    latitude: null,
    longitude: null,
    radius: DEFAULT_CONFIG.GEOFENCE_RADIUS,
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeAttendanceId, setActiveAttendanceId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

  const handleLogout = async () => {
    await logout().catch(() => {});
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    navigate('/login');
  };

  const { lat, lng, isLoading: locationLoading, error: locationError, isWithinOffice } = useGeolocation(
    officeConfig.latitude,
    officeConfig.longitude,
    officeConfig.radius
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load office config and today's attendances from API
  useEffect(() => {
    getOffices()
      .then((res) => {
        console.log('offices response:', res);
        const offices = res?.data ?? res;
        console.log('offices array:', offices);
        if (offices?.length) {
          const { id, latitude, longitude, radius } = offices[0];
          console.log('office id:', id);
          // DEV MODE: use user's current location as office coords
          navigator.geolocation.getCurrentPosition((pos) => {
            setOfficeConfig({
              id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              radius: radius ?? DEFAULT_CONFIG.GEOFENCE_RADIUS,
            });
          });
        } else {
          navigator.geolocation.getCurrentPosition((pos) => {
            setOfficeConfig({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              radius: DEFAULT_CONFIG.GEOFENCE_RADIUS,
            });
          });
        }
      })
      .catch(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
          setOfficeConfig({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            radius: DEFAULT_CONFIG.GEOFENCE_RADIUS,
          });
        });
      });

    getAttendances()
      .then((res) => {
        const records = res?.data ?? res;
        if (!records?.length) return;
        const today = new Date().toDateString();
        const todayRecords = records.filter(
          (r) => new Date(r.clock_in ?? r.work_date).toDateString() === today
        );
        const mapped = todayRecords.map((r) => ({
          id: r.id,
          time: new Date(r.clock_out ?? r.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          type: r.clock_out ? 'Clock Out' : 'Clock In',
          location: r.lat_in && r.lng_in ? `${parseFloat(r.lat_in).toFixed(4)}, ${parseFloat(r.lng_in).toFixed(4)}` : '—',
          status: r.status ?? 'Completed',
        }));
        setAttendanceLog(mapped);
        const last = todayRecords[todayRecords.length - 1];
        if (last && !last.clock_out) {
          setIsClockedIn(true);
          setActiveAttendanceId(last.id);
        }
      })
      .catch(() => {});
  }, []);

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const handleClockToggle = async () => {
    if (!isWithinOffice && !isClockedIn) {
      setErrorMessage('You are out of office range. Cannot clock in.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    setIsLoading(true);
    try {
      let record;
      if (!isClockedIn) {
        console.log('clocking in with:', { lat, lng, office_id: officeConfig.id });
        const res = await clockIn(lat, lng, officeConfig.id);
        record = res?.data ?? res;
        setActiveAttendanceId(record.id);
      } else {
        const res = await clockOut(activeAttendanceId, lat, lng);
        record = res?.data ?? res;
        setActiveAttendanceId(null);
      }

      const newEntry = {
        id: record.id,
        time: formatTime(new Date()),
        type: isClockedIn ? 'Clock Out' : 'Clock In',
        location: `${lat?.toFixed(4)}, ${lng?.toFixed(4)}`,
        status: 'Completed',
      };

      setAttendanceLog((prev) => [...prev, newEntry]);
      setIsClockedIn(!isClockedIn);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`Failed to update attendance. Please try again. ${error.message}`);
      setTimeout(() => setErrorMessage(''), 4000);
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
                <span className="text-sm font-medium">{currentUser.name || 'Attendance'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
              >
                <LogOut className="w-3 h-3" /> Logout
              </button>
              <NotificationBell />
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isClockedIn 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {isClockedIn ? 'CLOCKED IN' : 'CLOCKED OUT'}
              </div>
            </div>
          </div>

          {/* Real-time Clock Section */}
          <div className="p-8 text-center border-b border-gray-200">
            <div className="text-6xl md:text-7xl font-bold text-primary-700 font-mono mb-2">
              {formatTime(currentTime)}
            </div>
            <p className="text-gray-600 text-sm">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Geofencing Status */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                isWithinOffice 
                  ? 'bg-success-50 border border-success-200' 
                  : 'bg-danger-50 border border-danger-200'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  isWithinOffice ? 'bg-success-500' : 'bg-danger-500'
                }`} />
                <span className={`text-sm font-semibold ${
                  isWithinOffice ? 'text-success-700' : 'text-danger-700'
                }`}>
                  {isWithinOffice ? 'In Range' : 'Out of Range'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {locationLoading ? 'Detecting location...' : 
                     lat && lng ? `${lat.toFixed(6)}°, ${lng.toFixed(6)}°` : 
                     'Location not available'}
                  </span>
                </div>
                {lat && lng && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    lat: {lat.toFixed(6)} | lng: {lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            {locationError && (
              <div className="mt-3 flex items-start gap-2 bg-danger-50 border border-danger-200 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-danger-700">{locationError}</p>
              </div>
            )}
          </div>

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
                ${isClockedIn
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
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            entry.type === 'Clock In'
                              ? 'bg-success-100 text-success-700'
                              : 'bg-danger-100 text-danger-700'
                          }`}>
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

export default AttendanceUI;
