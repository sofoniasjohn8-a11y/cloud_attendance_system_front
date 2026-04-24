import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import AttendanceUI from './components/AttendanceUI';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('current_user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/attendance" replace />;
  if (!requireAdmin && user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AttendanceUI />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
