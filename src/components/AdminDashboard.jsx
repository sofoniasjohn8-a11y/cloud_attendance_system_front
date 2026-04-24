import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Mail, LogOut, RefreshCw, AlertCircle, Clock, Calendar } from 'lucide-react';
import { getAdminOverview, getAdminCalendar, notifyAbsent, notifyAbsentAll, logout } from '../services/attendanceService';

const STATUS_STYLES = {
  present: 'bg-green-100 text-green-700',
  late:    'bg-yellow-100 text-yellow-700',
  absent:  'bg-red-100 text-red-700',
};

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview'); // 'overview' | 'calendar'
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [breakdown, setBreakdown] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
  const now = new Date();

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await getAdminOverview(date);
      const data = res?.data ?? res;
      setBreakdown(Array.isArray(data?.schedule_breakdown) ? data.schedule_breakdown : []);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await getAdminCalendar(now.getMonth() + 1, now.getFullYear());
      const data = res?.data ?? res;
      setCalendarDays(Array.isArray(data?.days) ? data.days : []);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'overview') fetchOverview();
    else fetchCalendar();
  }, [tab, date]);

  const handleNotifyOne = async (user_id) => {
    setNotifying(user_id);
    try {
      await notifyAbsent(user_id, date);
      showMessage('Absence notification sent.');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setNotifying(null);
    }
  };

  const handleNotifyAll = async () => {
    setNotifying('all');
    try {
      await notifyAbsentAll(date);
      showMessage('Notifications sent to all absent users.');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setNotifying(null);
    }
  };

  const handleLogout = async () => {
    await logout().catch(() => {});
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    navigate('/login');
  };

  const present = breakdown.filter((s) => s.status === 'present' || s.status === 'late');
  const absent  = breakdown.filter((s) => s.status === 'absent');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome, {currentUser.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors text-gray-600"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'overview', label: 'Daily Overview', icon: Users },
            { key: 'calendar', label: 'Calendar', icon: Calendar },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <>
            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <button
                  onClick={fetchOverview}
                  className="flex items-center gap-2 text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
                {absent.length > 0 && (
                  <button
                    onClick={handleNotifyAll}
                    disabled={notifying === 'all'}
                    className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors ml-auto"
                  >
                    <Mail className="w-4 h-4" />
                    {notifying === 'all' ? 'Sending...' : `Notify All Absent (${absent.length})`}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Scheduled', value: breakdown.length, icon: Users,        color: 'text-blue-600 bg-blue-50' },
                { label: 'Present',   value: present.length,   icon: CheckCircle,  color: 'text-green-600 bg-green-50' },
                { label: 'Absent',    value: absent.length,    icon: XCircle,      color: 'text-red-600 bg-red-50' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{loading ? '—' : value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Schedule Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Schedule Breakdown</h2>
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
              ) : breakdown.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No schedules found for this date</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Employee</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Shift</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Clock In</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Clock Out</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {breakdown.map((slot) => (
                        <tr key={`${slot.schedule_id}-${slot.user?.id}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-gray-800">{slot.user?.name}</p>
                            <p className="text-xs text-gray-400">{slot.user?.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 font-mono">
                            {slot.clock_in ? new Date(slot.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 font-mono">
                            {slot.clock_out ? new Date(slot.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[slot.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {slot.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {slot.status === 'absent' && (
                              <button
                                onClick={() => handleNotifyOne(slot.user?.id)}
                                disabled={notifying === slot.user?.id}
                                className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <Mail className="w-3 h-3" />
                                {notifying === slot.user?.id ? 'Sending...' : 'Notify'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Calendar Tab */}
        {tab === 'calendar' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
                {now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : calendarDays.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No data for this month</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Day</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Scheduled</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Present</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Late</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Absent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {calendarDays.map((day) => (
                      <tr
                        key={day.date}
                        onClick={() => { setDate(day.date); setTab('overview'); }}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-primary-600">{day.date}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{day.day_of_week}</td>
                        <td className="px-5 py-4 text-sm text-gray-800">{day.scheduled}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{day.present}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">{day.late}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">{day.absent}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
