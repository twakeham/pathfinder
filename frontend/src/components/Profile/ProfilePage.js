import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const Card = ({ title, subtitle, actions, children }) => (
  <div style={{ maxWidth: 960, width: '96%', background: '#111827', color: '#e5e7eb', margin: '16px auto', padding: 0, borderRadius: 14, border: '1px solid #1f2937', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
    <div style={{ padding: 20, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        {subtitle && <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: 13 }}>{subtitle}</p>}
      </div>
      <div>{actions}</div>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' };
const buttonPrimary = { padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none' };
const buttonGhost = { padding: '10px 14px', borderRadius: 8, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' };

export default function ProfilePage() {
  const { user, apiFetch, refreshMe } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', department: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        department: user.department || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSave = useMemo(() => !!form.email && !!(form.first_name || user?.username), [form, user]);

  const onSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await apiFetch('/api/auth/me/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(Array.isArray(data?.detail) ? data.detail.join('\n') : (data?.detail || 'Failed to save profile'));
      }
      await refreshMe();
      setSuccess('Profile updated');
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', padding: 16 }}>
      <div style={{ maxWidth: 960, width: '96%', margin: '0 auto 8px' }}>
        <h1 style={{ color: '#e5e7eb', letterSpacing: 2, fontWeight: 800, margin: 0 }}>
          <span style={{ color: '#60a5fa' }}>PATH</span>FINDER
        </h1>
      </div>

      <Card
        title="Profile"
        subtitle="Update your personal information"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={buttonGhost} onClick={() => window.history.back()}>Cancel</button>
            <button type="submit" form="profileForm" disabled={saving || !canSave} style={buttonPrimary}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        }
      >
        {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}
        {success && <div style={{ color: '#6ee7b7', marginBottom: 12 }}>{success}</div>}
        <form id="profileForm" onSubmit={onSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label htmlFor="first_name" style={labelStyle}>First name</label>
              <input id="first_name" type="text" value={form.first_name} onChange={set('first_name')} placeholder="Jane" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="last_name" style={labelStyle}>Last name</label>
              <input id="last_name" type="text" value={form.last_name} onChange={set('last_name')} placeholder="Doe" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input id="email" type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" style={inputStyle} required />
            </div>
            <div>
              <label htmlFor="department" style={labelStyle}>Department</label>
              <input id="department" type="text" value={form.department} onChange={set('department')} placeholder="Engineering" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / span 2' }}>
              <label htmlFor="avatar_url" style={labelStyle}>Avatar URL</label>
              <input id="avatar_url" type="url" value={form.avatar_url} onChange={set('avatar_url')} placeholder="https://…" style={inputStyle} />
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
