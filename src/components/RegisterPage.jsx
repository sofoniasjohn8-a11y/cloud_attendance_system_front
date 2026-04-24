import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Loader } from 'lucide-react';
import FaceCapture from './FaceCapture';
import { loadModels, getDescriptor, registerFace } from '../services/faceService';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [step, setStep] = useState('form'); // 'form' | 'face' | 'loading'
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return setError('All fields required');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[form.email]) return setError('Email already registered');
    setError('');
    setStep('face');
  };

  const handleVideoReady = async (videoEl) => {
    videoRef.current = videoEl;
    await loadModels();
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setStep('loading');
    const descriptor = await getDescriptor(videoRef.current);
    if (!descriptor) {
      setError('No face detected. Please try again.');
      setStep('face');
      return;
    }
    // Save user
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    users[form.email] = { name: form.name, email: form.email, password: form.password };
    localStorage.setItem('users', JSON.stringify(users));
    registerFace(form.email, descriptor);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <UserPlus className="w-10 h-10 text-primary-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 text-sm">
            {step === 'face' ? 'Step 2: Register your face' : 'Step 1: Fill in your details'}
          </p>
        </div>

        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
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
            <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors">
              Continue
            </button>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <span className="text-primary-600 cursor-pointer font-medium" onClick={() => navigate('/login')}>
                Login
              </span>
            </p>
          </form>
        )}

        {(step === 'face' || step === 'loading') && (
          <div className="flex flex-col items-center gap-5">
            <FaceCapture onReady={handleVideoReady} label="Look straight at the camera" />
            <button
              onClick={handleCapture}
              disabled={step === 'loading'}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {step === 'loading' ? (
                <><Loader className="w-4 h-4 animate-spin" /> Capturing...</>
              ) : (
                'Capture Face & Register'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
