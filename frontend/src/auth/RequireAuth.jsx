import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAuth({ children, roles }) {
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
}
