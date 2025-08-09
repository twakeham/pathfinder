import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const COURSES_API_BASE = '/api/courses/courses/';
const MODULES_API_BASE = '/api/courses/modules/';

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' };
const buttonPrimary = { padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1f2937' };
const buttonGhost = { padding: '10px 14px', borderRadius: 8, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' };

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ title: '', description: '', is_published: false });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`${COURSES_API_BASE}${id}/`);
        if (!res.ok) {
          let body = '';
          try { body = await res.text(); } catch {}
          throw new Error(`Failed to load course (${res.status}): ${body || res.statusText}`);
        }
        const data = await res.json();
        setForm({
          title: data.title || '',
          description: data.description || '',
          is_published: !!data.is_published,
        });
      } catch (e) {
        setError(e.message || 'Error loading course');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const canSave = useMemo(() => !!form.title.trim(), [form.title]);

  const onSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!canSave) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(`${COURSES_API_BASE}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data?.detail) ? data.detail.join('\n') : (data?.detail || 'Failed to save course');
        throw new Error(msg);
      }
      // On success, return to course list
      navigate('/instructor/courses', { replace: true });
      return;
    } catch (err) {
      setError(err.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
  <h3 style={{ margin: 0, color: '#e5e7eb' }}>Course Editor</h3>
  {!loading && form.title && (
          <div style={{ 
            fontSize: 14, 
            color: '#9ca3af',
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            marginBottom: 8
          }}>
            <Link 
              to="/instructor/courses" 
              style={{ 
                color: '#93c5fd', 
                textDecoration: 'none',
                fontSize: 14
              }}
            >
              Courses
            </Link>
            <span style={{ color: '#6b7280' }}>›</span>
            <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{form.title}</span>
          </div>
        )}
      </div>

      <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Metadata</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#9ca3af' }}>Title, description, and publication state</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => navigate('/instructor/courses')} style={buttonGhost} disabled={saving}>Cancel</button>
            <button type="submit" form="courseEditorForm" style={buttonPrimary} disabled={saving || !canSave}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ color: '#9ca3af' }}>Loading…</div>
          ) : (
            <form id="courseEditorForm" onSubmit={onSave}>
              {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}
              {success && <div style={{ color: '#6ee7b7', marginBottom: 12 }}>{success}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div>
                  <label htmlFor="title" style={labelStyle}>Title</label>
                  <input id="title" type="text" value={form.title} onChange={set('title')} placeholder="e.g., Intro to Prompt Engineering" style={inputStyle} required />
                </div>
                <div>
                  <label htmlFor="description" style={labelStyle}>Description</label>
                  <textarea id="description" rows={6} value={form.description} onChange={set('description')} placeholder="Short description" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div 
                    onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: form.is_published ? '#10b981' : '#374151',
                      border: '2px solid',
                      borderColor: form.is_published ? '#10b981' : '#6b7280',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        left: form.is_published ? 24 : 4,
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                  </div>
                  <span style={{ 
                    color: form.is_published ? '#10b981' : '#9ca3af', 
                    fontSize: 13,
                    fontWeight: 500,
                    userSelect: 'none'
                  }}>
                    {form.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Module Manager */}
      <div style={{ marginTop: 16, background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
        <ModuleManager courseId={id} />
      </div>

      {/* Removed Lessons card; lessons are managed on the Module Editor page */}
    </div>
  );
}

function ModuleManager({ courseId }) {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState('');

  const [dragIndex, setDragIndex] = useState(null);

  const listUrl = `${COURSES_API_BASE}${courseId}/modules/`;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(listUrl);
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch {}
        throw new Error(`Failed to load modules (${res.status}): ${body || res.statusText}`);
      }
      const data = await res.json();
      setModules((data || []).slice().sort((a, b) => (a.order - b.order) || (a.id - b.id)));
    } catch (e) {
      setError(e.message || 'Error loading modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [courseId]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const payload = { course: Number(courseId), title: newTitle.trim(), description: newDesc, order: (modules.length ? Math.max(...modules.map(m => m.order || 0)) + 1 : 1) };
      const res = await apiFetch(MODULES_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch {}
        throw new Error(`Failed to create module (${res.status}): ${body || res.statusText}`);
      }
      setNewTitle('');
      setNewDesc('');
      setCreateOpen(false);
      load();
    } catch (e) {
      setCreateError(e.message || 'Error creating module');
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this module?')) return;
    try {
      const res = await apiFetch(`${MODULES_API_BASE}${id}/`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        let body = '';
        try { body = await res.text(); } catch {}
        throw new Error(`Failed to delete module (${res.status}): ${body || res.statusText}`);
      }
      load();
    } catch (e) {
      setError(e.message || 'Error deleting module');
    }
  };

  // Return the new ordered list so we can persist immediately
  const reorder = (fromIdx, toIdx) => {
    if (fromIdx === null || toIdx === null || fromIdx === toIdx) return null;
    const next = modules.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setModules(next);
    return next;
  };

  // Accept an explicit list to avoid relying on async state updates
  const persistOrder = async (list) => {
    try {
      const arr = Array.isArray(list) ? list : modules;
      const updates = arr.map((m, idx) => ({ id: m.id, order: idx + 1 }));
      await Promise.all(
        updates.map(u => apiFetch(`${MODULES_API_BASE}${u.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: u.order }),
        }))
      );
      load();
    } catch (e) {
      setError(e.message || 'Error saving order');
    }
  };

  return (
    <div>
      <div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Modules</div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#9ca3af' }}>Create, edit, reorder</div>
        </div>
        <button onClick={() => { setCreateError(''); setCreateOpen(true); }} style={buttonPrimary} type="button">Add module</button>
      </div>

      <div style={{ padding: 16 }}>
        {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}

        {loading ? (
          <div style={{ color: '#9ca3af' }}>Loading modules…</div>
        ) : modules.length === 0 ? (
          <div style={{ color: '#9ca3af' }}>No modules yet.</div>
        ) : (
          <div>
            {modules.map((m, idx) => (
              <div
                key={m.id}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async () => { const next = reorder(dragIndex, idx); setDragIndex(null); if (next) { await persistOrder(next); } }}
                style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 12px', border: '1px dashed #1f2937', borderRadius: 10, marginBottom: 8, background: '#0b1220' }}
                title="Drag to reorder"
              >
                <div style={{ cursor: 'grab', userSelect: 'none', color: '#9ca3af' }}>≡</div>
                <div>
                  <div 
                    onClick={() => navigate(`/instructor/modules/${m.id}/edit`)}
                    style={{ 
                      fontWeight: 600, 
                      color: '#93c5fd', 
                      cursor: 'pointer',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {m.title}
                  </div>
                  {m.description && <div style={{ color: '#9ca3af', fontSize: 13 }}>{m.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => onDelete(m.id)} 
                    style={{ 
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#ef444420';
                      e.target.style.borderColor = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.borderColor = '#374151';
                    }}
                    title="Delete module"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <div role="dialog" aria-modal="true" onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '100%', background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Add module</div>
              <button onClick={() => setCreateOpen(false)} style={buttonGhost} type="button">Close</button>
            </div>
            <form onSubmit={onCreate}>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {createError && <div style={{ color: '#fca5a5' }}>{createError}</div>}
                <div>
                  <label style={labelStyle}>Title</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Fundamentals" style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Description (optional)</label>
                  <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={4} placeholder="Short description" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ padding: 16, borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setCreateOpen(false)} style={buttonGhost}>Cancel</button>
                <button type="submit" disabled={creating || !newTitle.trim()} style={buttonPrimary}>{creating ? 'Creating…' : 'Create module'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
