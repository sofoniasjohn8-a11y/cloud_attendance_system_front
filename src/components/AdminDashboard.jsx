import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Mail, LogOut, RefreshCw, AlertCircle, Clock, Calendar, MapPin, Building2, Trash2, Edit2, Save, X, UserCog } from 'lucide-react';
import {
  getAdminOverview, getAdminCalendar, notifyAbsent, notifyAbsentAll, logout,
  getAdminUsers, updateUserRole, updateUserOffice, deleteUser,
  getOffices, createOffice, updateOffice, deleteOffice,
} from '../services/attendanceService';

const STATUS_STYLES = {
  present: 'bg-green-100 text-green-700',
  late:    'bg-yellow-100 text-yellow-700',
  absent:  'bg-red-100 text-red-700',
};

const ROLES = ['employee', 'admin'];

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview'); // 'overview' | 'calendar' | 'users' | 'offices'
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [breakdown, setBreakdown] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  // office form
  const [officeForm, setOfficeForm] = useState({ name: '', latitude: '', longitude: '', radius: 100 });
  const [editingOffice, setEditingOffice] = useState(null); // office object being edited
  const [savingOffice, setSavingOffice] = useState(false);
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
      // group schedule_breakdown by user — one row per user, merge their shifts
      const raw = Array.isArray(data?.schedule_breakdown) ? data.schedule_breakdown : [];
      const byUser = {};
      raw.forEach((slot) => {
        const uid = slot.user?.id;
        if (!byUser[uid]) {
          byUser[uid] = { ...slot, shifts: [] };
        }
        byUser[uid].shifts.push({ start_time: slot.start_time, end_time: slot.end_time });
        // if any shift is present/late, mark user as present/late
        if (slot.status === 'present' || slot.status === 'late') {
          byUser[uid].status = slot.status;
          byUser[uid].clock_in  = byUser[uid].clock_in  ?? slot.clock_in;
          byUser[uid].clock_out = byUser[uid].clock_out ?? slot.clock_out;
        }
      });
      setBreakdown(Object.values(byUser));
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usersRes, officesRes] = await Promise.all([getAdminUsers(), getOffices()]);
      const ud = usersRes?.data ?? usersRes;
      const od = officesRes?.data ?? officesRes;
      const officeList = Array.isArray(od) ? od : [];
      const userList = Array.isArray(ud) ? ud.map((u) => ({
        ...u,
        office: officeList.find((o) => o.id === u.office_id) ?? null,
      })) : [];
      setOffices(officeList);
      setUsers(userList);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const res = await getOffices();
      const data = res?.data ?? res;
      setOffices(Array.isArray(data) ? data : []);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'overview') fetchOverview();
    else if (tab === 'calendar') fetchCalendar();
    else if (tab === 'users') fetchUsers();
    else if (tab === 'offices') fetchOffices();
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

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
      showMessage('Role updated.');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleOfficeChange = async (id, office_id) => {
    if (!office_id) return;
    const parsed = parseInt(office_id, 10);
    try {
      await updateUserOffice(id, parsed);
      const office = offices.find((o) => o.id === parsed) ?? null;
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, office_id: parsed, office } : u));
      showMessage('Office updated.');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showMessage('User deleted.');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleSaveOffice = async () => {
    setSavingOffice(true);
    try {
      if (editingOffice) {
        const res = await updateOffice(editingOffice.id, officeForm);
        const updated = res?.data ?? res;
        setOffices((prev) => prev.map((o) => o.id === editingOffice.id ? updated : o));
        showMessage('Office updated.');
      } else {
        const res = await createOffice(officeForm);
        const created = res?.data ?? res;
        setOffices((prev) => [...prev, created]);
        showMessage('Office created.');
      }
      setEditingOffice(null);
      setOfficeForm({ name: '', latitude: '', longitude: '', radius: 100 });
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setSavingOffice(false);
    }
  };

  const handleDeleteOffice = async (id) => {
    if (!confirm('Delete this office?')) return;
    try {
      await deleteOffice(id);
      setOffices((prev) => prev.filter((o) => o.id !== id));
      showMessage('Office deleted.');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const startEditOffice = (office) => {
    setEditingOffice(office);
    setOfficeForm({ name: office.name, latitude: office.latitude, longitude: office.longitude, radius: office.radius_meters ?? office.radius ?? 100 });
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
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'overview', label: 'Daily Overview', icon: Users },
            { key: 'calendar', label: 'Calendar', icon: Calendar },
            { key: 'users', label: 'Users', icon: UserCog },
            { key: 'offices', label: 'Offices', icon: Building2 },
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
                        <tr key={`${slot.user?.id}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-gray-800">{slot.user?.name}</p>
                            <p className="text-xs text-gray-400">{slot.user?.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            {slot.shifts?.map((s, i) => (
                              <div key={i} className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(s.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} –{' '}
                                {new Date(s.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </div>
                            ))}
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

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">All Users</h2>
              <button onClick={fetchUsers} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Office</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-sm font-medium text-gray-800">{u.name}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                        <td className="px-5 py-4">
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <select
                                value={u.office?.id ?? ''}
                                onChange={(e) => handleOfficeChange(u.id, e.target.value)}
                                className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 appearance-none cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-colors"
                              >
                                <option value="">— No office —</option>
                                {offices.map((o) => (
                                  <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                              </select>
                            </div>
                            {u.office && (
                              <p className="text-xs text-gray-400 font-mono pl-5">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {parseFloat(u.office.latitude).toFixed(4)}, {parseFloat(u.office.longitude).toFixed(4)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === currentUser.id}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Offices Tab */}
        {tab === 'offices' && (
          <div className="space-y-6">
            {/* Office Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">
                {editingOffice ? `Edit: ${editingOffice.name}` : 'Add New Office'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  placeholder="Office name"
                  value={officeForm.name}
                  onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <input
                  placeholder="Latitude"
                  type="number"
                  step="any"
                  value={officeForm.latitude}
                  onChange={(e) => setOfficeForm({ ...officeForm, latitude: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <input
                  placeholder="Longitude"
                  type="number"
                  step="any"
                  value={officeForm.longitude}
                  onChange={(e) => setOfficeForm({ ...officeForm, longitude: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <input
                  placeholder="Radius (m)"
                  type="number"
                  value={officeForm.radius}
                  onChange={(e) => setOfficeForm({ ...officeForm, radius: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <button
                type="button"
                onClick={() => navigator.geolocation.getCurrentPosition(
                  (pos) => setOfficeForm((f) => ({ ...f, latitude: pos.coords.latitude.toFixed(7), longitude: pos.coords.longitude.toFixed(7) })),
                  () => showMessage('Could not get location. Allow browser location access.', 'error')
                )}
                className="mt-2 flex items-center gap-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors border border-blue-200"
              >
                <MapPin className="w-4 h-4" /> Use My Current Location
              </button>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSaveOffice}
                  disabled={savingOffice || !officeForm.name || !officeForm.latitude || !officeForm.longitude}
                  className="flex items-center gap-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingOffice ? 'Saving...' : editingOffice ? 'Update Office' : 'Create Office'}
                </button>
                {editingOffice && (
                  <button
                    onClick={() => { setEditingOffice(null); setOfficeForm({ name: '', latitude: '', longitude: '', radius: 100 }); }}
                    className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Offices List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">All Offices</h2>
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
              ) : offices.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No offices configured</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Name</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Latitude</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Longitude</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Radius (m)</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {offices.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                              <Building2 className="w-4 h-4 text-primary-500" /> {o.name}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-mono text-gray-600">{parseFloat(o.latitude).toFixed(6)}</td>
                          <td className="px-5 py-4 text-sm font-mono text-gray-600">{parseFloat(o.longitude).toFixed(6)}</td>
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-3 h-3" /> {o.radius_meters ?? o.radius ?? 100} m
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => startEditOffice(o)}
                                className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteOffice(o.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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
