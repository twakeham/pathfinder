import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProfilePage from './components/Profile/ProfilePage';
import InstructorLayout from './components/Instructor/InstructorLayout';
import CoursesList from './components/Instructor/CoursesList';
import CourseEditor from './components/Instructor/CourseEditor';
import ModuleEditor from './components/Instructor/ModuleEditor';
import LessonEditor from './components/Instructor/LessonEditor';
import QuizEditor from './components/Instructor/QuizEditor';
import QuestionEditor from './components/Instructor/QuestionEditor';

const Protected = ({ children, roles }) => {
  const { tokens, user, loadingUser } = useAuth();
  if (!tokens) return <Navigate to="/login" replace />;
  if (loadingUser) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: '#e5e7eb' }}>
      {children}
    </div>
  );
};

const Home = () => {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#e5e7eb' }}>Welcome, {user?.first_name || user?.username}</h2>
          <p style={{ marginTop: 6, color: '#9ca3af' }}>Role: <strong>{user?.role}</strong></p>
        </div>
        <button onClick={logout} style={{ padding: '8px 12px', borderRadius: 8, background: '#111827', color: 'white', border: '1px solid #374151' }}>
          Log out
        </button>
      </div>
      <div style={{ marginTop: 24, padding: 16, border: '1px solid #1f2937', borderRadius: 8, background: '#111827' }}>
        <h3 style={{ marginTop: 0, color: '#e5e7eb' }}>General User Area</h3>
        <ul style={{ color: '#9ca3af' }}>
          <li>Access learning content</li>
          <li>Use chat assistant</li>
        </ul>
      </div>
    </div>
  );
};

const AdminArea = () => (
  <div style={{ padding: 24 }}>
    <h2 style={{ color: '#e5e7eb' }}>Admin Tools</h2>
    <ul style={{ color: '#9ca3af' }}>
      <li>Manage users and approvals</li>
      <li>Create invites for roles</li>
      <li>View system analytics</li>
    </ul>
  </div>
);

const InstructorArea = () => (
  <div style={{ padding: 24 }}>
    <h2>Instructor Tools</h2>
    <ul>
      <li>Author and manage courses</li>
      <li>Review learner progress</li>
    </ul>
  </div>
);

const AppBar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return null;
  return (
    <div style={{ background: '#0b1120', borderBottom: '1px solid #1f2937' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: '#e5e7eb', letterSpacing: 2, fontWeight: 800, margin: 0, fontSize: 18 }}>
            <span style={{ color: '#60a5fa' }}>PATH</span>FINDER
          </h1>
        </Link>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {(user.role === 'admin') && <Link to="/admin" style={{ color: '#93c5fd' }}>Admin</Link>}
          {(user.role === 'admin' || user.role === 'instructor') && <Link to="/instructor" style={{ color: '#93c5fd' }}>Instructor</Link>}
          <Link to="/" style={{ color: '#93c5fd' }}>Home</Link>
          <Link to="/profile" style={{ color: location.pathname === '/profile' ? '#60a5fa' : '#93c5fd' }}>Profile</Link>
          <button onClick={logout} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 8, background: '#111827', color: 'white', border: '1px solid #374151' }}>Log out</button>
        </nav>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <>
      <AppBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Protected><Home /></Protected>} />
        <Route path="/admin" element={<Protected roles={["admin"]}><AdminArea /></Protected>} />
        <Route path="/instructor" element={<Protected roles={["admin", "instructor"]}><InstructorLayout /></Protected>}>
          <Route index element={<Navigate to="courses" replace />} />
          <Route path="courses" element={<CoursesList />} />
          <Route path="courses/:id/edit" element={<CourseEditor />} />
          <Route path="modules/:moduleId/edit" element={<ModuleEditor />} />
          <Route path="lessons/:lessonId/edit" element={<LessonEditor />} />
          <Route path="quizzes/:quizId/edit" element={<QuizEditor />} />
          <Route path="questions/:questionId/edit" element={<QuestionEditor />} />
        </Route>
        <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

const LoginPage = () => {
  const { login } = useAuth();
  return <Login onLogin={login} onShowRegister={() => { window.location.href = '/register'; }} />;
};

const RegisterPage = () => {
  return <Register onRegistered={() => { window.location.href = '/login'; }} onShowLogin={() => { window.location.href = '/login'; }} />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
