import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

export default function InstructorLayout() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: '#e5e7eb' }}>Instructor</h2>
        <Link to="/" style={{ color: '#93c5fd' }}>Back to Home</Link>
      </div>
      <div style={{ borderBottom: '1px solid #1f2937', marginBottom: 16, display: 'flex', gap: 16 }}>
        <NavLink to="/instructor/courses" style={({ isActive }) => ({ padding: '8px 0', color: isActive ? '#e5e7eb' : '#9ca3af', textDecoration: 'none', borderBottom: isActive ? '2px solid #60a5fa' : '2px solid transparent' })}>Courses</NavLink>
      </div>
      <Outlet />
    </div>
  );
}
