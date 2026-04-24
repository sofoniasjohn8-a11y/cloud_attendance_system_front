import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Loader } from 'lucide-react';
import { register } from '../services/attendanceService';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return setError('All fields required');
    setError('');
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, password: form.password });
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('current_user', JSON.stringify(res.user));
      navigate('/attendance');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <UserPlus className="w-10 h-10 text-primary-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
        </div>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Registering...</> : 'Register'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <span className="text-primary-600 cursor-pointer font-medium" onClick={() => navigate('/login')}>Login</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
