import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const MODULES_API_BASE = '/api/courses/modules/';
const LESSONS_API_BASE = '/api/courses/lessons/';

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' };
const buttonPrimary = { padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1f2937' };
const buttonGhost = { padding: '10px 14px', borderRadius: 8, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' };

export default function ModuleEditor() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [module, setModule] = useState(null);
  const [form, setForm] = useState({ title: '', description: '' });

  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [createError, setCreateError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    const loadModule = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`${MODULES_API_BASE}${moduleId}/`);
        if (!res.ok) {
          let body = ''; try { body = await res.text(); } catch {}
          throw new Error(`Failed to load module (${res.status}): ${body || res.statusText}`);
        }
        const data = await res.json();
        setModule(data);
        setForm({ title: data.title || '', description: data.description || '' });
      } catch (e) {
        setError(e.message || 'Error loading module');
      } finally {
        setLoading(false);
      }
    };
    loadModule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const canSave = useMemo(() => !!form.title.trim(), [form.title]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${MODULES_API_BASE}${moduleId}/`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.detail || 'Failed to save module';
        throw new Error(msg);
  }
  // Back to course editor for this module's course
  navigate(`/instructor/courses/${module.course}/edit`, { replace: true });
    } catch (e) {
      setError(e.message || 'Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const listLessons = async () => {
    if (!moduleId) return;
    setLessonsLoading(true);
    setLessonsError('');
    try {
      const res = await apiFetch(`${MODULES_API_BASE}${moduleId}/lessons/`);
      if (!res.ok) {
        let body = ''; try { body = await res.text(); } catch {}
        throw new Error(`Failed to load lessons (${res.status}): ${body || res.statusText}`);
      }
      const data = await res.json();
      setLessons((data || []).slice().sort((a, b) => (a.order - b.order) || (a.id - b.id)));
    } catch (e) {
      setLessonsError(e.message || 'Error loading lessons');
    } finally {
      setLessonsLoading(false);
    }
  };

  useEffect(() => { listLessons(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [moduleId]);

  const openCreate = () => { setCreateError(''); setNewTitle(''); setNewContent(''); setNewDuration(''); setCreateOpen(true); };
  const onCreateLesson = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        module: Number(moduleId),
        title: newTitle.trim(),
        content: newContent,
        duration_minutes: newDuration ? Number(newDuration) : null,
        order: (lessons.length ? Math.max(...lessons.map(l => l.order || 0)) + 1 : 1),
      };
      const res = await apiFetch(LESSONS_API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        let body = ''; try { body = await res.text(); } catch {}
        throw new Error(`Failed to create lesson (${res.status}): ${body || res.statusText}`);
      }
      setCreateOpen(false);
      setNewTitle(''); setNewContent(''); setNewDuration('');
      listLessons();
    } catch (e) {
      setCreateError(e.message || 'Error creating lesson');
    } finally {
      setCreating(false);
    }
  };

  const cancelEdit = () => { setEditingId(null); setEditTitle(''); setEditContent(''); setEditDuration(''); };
  
  const saveEdit = async (id) => {
    try {
      const res = await apiFetch(`${LESSONS_API_BASE}${id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editTitle, content: editContent, duration_minutes: editDuration ? Number(editDuration) : null }) });
      if (!res.ok) {
        let body = ''; try { body = await res.text(); } catch {}
        throw new Error(`Failed to save lesson (${res.status}): ${body || res.statusText}`);
      }
      cancelEdit();
      listLessons();
    } catch (e) {
      setLessonsError(e.message || 'Error saving lesson');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      const res = await apiFetch(`${LESSONS_API_BASE}${id}/`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        let body = ''; try { body = await res.text(); } catch {}
        throw new Error(`Failed to delete lesson (${res.status}): ${body || res.statusText}`);
      }
      listLessons();
    } catch (e) {
      setLessonsError(e.message || 'Error deleting lesson');
    }
  };

  const togglePublish = async (lesson, flag) => {
    try {
      const res = await apiFetch(`${LESSONS_API_BASE}${lesson.id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_published: !!flag }) });
      if (!res.ok) {
        let body = ''; try { body = await res.text(); } catch {}
        throw new Error(`Failed to update publish state (${res.status}): ${body || res.statusText}`);
      }
      setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, is_published: !!flag } : l));
    } catch (e) {
      setLessonsError(e.message || 'Error updating publish state');
    }
  };

  const reorder = (fromIdx, toIdx) => {
    if (fromIdx === null || toIdx === null || fromIdx === toIdx) return null;
    const next = lessons.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setLessons(next);
    return next;
  };
  const persistOrder = async (list) => {
    try {
      const arr = Array.isArray(list) ? list : lessons;
      const updates = arr.map((l, idx) => ({ id: l.id, order: idx + 1 }));
      await Promise.all(
        updates.map(u => apiFetch(`${LESSONS_API_BASE}${u.id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: u.order }) }))
      );
      listLessons();
    } catch (e) {
      setLessonsError(e.message || 'Error saving order');
    }
  };

  return (
    <div style={{ padding: '16px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
  <h3 style={{ margin: 0, color: '#e5e7eb' }}>Module Editor</h3>
  {!loading && module && (
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
            <Link 
              to={`/instructor/courses/${module.course}/edit`}
              style={{ 
                color: '#93c5fd', 
                textDecoration: 'none',
                fontSize: 14
              }}
            >
              {module.course_title || 'Course'}
            </Link>
            <span style={{ color: '#6b7280' }}>›</span>
            <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{module.title}</span>
          </div>
  )}
      </div>

      <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Module details</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#9ca3af' }}>Update title and description</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {module && <Link to={`/instructor/courses/${module.course}/edit`} style={{ ...buttonGhost, padding: '10px 14px' }}>Cancel</Link>}
            <button type="submit" form="moduleEditorForm" style={buttonPrimary} disabled={saving || !canSave}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ color: '#9ca3af' }}>Loading…</div>
          ) : (
            <form id="moduleEditorForm" onSubmit={onSave}>
              {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div>
                  <label htmlFor="title" style={labelStyle}>Title</label>
                  <input id="title" type="text" value={form.title} onChange={set('title')} placeholder="Module title" style={inputStyle} required />
                </div>
                <div>
                  <label htmlFor="description" style={labelStyle}>Description</label>
                  <textarea id="description" rows={6} value={form.description} onChange={set('description')} placeholder="Short description" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Lessons</div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#9ca3af' }}>Manage lessons in this module</div>
          </div>
          <button onClick={openCreate} style={buttonPrimary} type="button">Add lesson</button>
        </div>
        <div style={{ padding: 16 }}>
          {lessonsError && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{lessonsError}</div>}
          {lessonsLoading ? (
            <div style={{ color: '#9ca3af' }}>Loading lessons…</div>
          ) : lessons.length === 0 ? (
            <div style={{ color: '#9ca3af' }}>No lessons yet.</div>
          ) : (
            <div>
              {lessons.map((l, idx) => (
                <div
                  key={l.id}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async () => { const next = reorder(dragIndex, idx); setDragIndex(null); if (next) await persistOrder(next); }}
                  style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 12, alignItems: 'center', padding: '10px 12px', border: '1px dashed #1f2937', borderRadius: 10, marginBottom: 8, background: '#0b1220' }}
                  title="Drag to reorder"
                >
                  <div style={{ cursor: 'grab', userSelect: 'none', color: '#9ca3af' }}>≡</div>
                  <div>
                    {editingId === l.id ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={inputStyle} />
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                        <div>
                          <label style={labelStyle}>Duration (minutes)</label>
                          <input type="number" min={0} value={editDuration} onChange={(e) => setEditDuration(e.target.value)} style={inputStyle} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div 
                          onClick={() => navigate(`/instructor/lessons/${l.id}/edit`)}
                          style={{ 
                            fontWeight: 600, 
                            color: '#93c5fd', 
                            cursor: 'pointer',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {l.title}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: 13 }}>
                          {typeof l.duration_minutes === 'number' ? `${l.duration_minutes} min` : ''}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ 
                      color: l.is_published ? '#10b981' : '#9ca3af', 
                      fontSize: 13,
                      fontWeight: 500,
                      userSelect: 'none'
                    }}>
                      {l.is_published ? 'Published' : 'Draft'}
                    </span>
                    <div 
                      onClick={() => togglePublish(l, !l.is_published)}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        background: l.is_published ? '#10b981' : '#374151',
                        border: '2px solid',
                        borderColor: l.is_published ? '#10b981' : '#6b7280',
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
                          left: l.is_published ? 24 : 4,
                          transition: 'left 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editingId === l.id ? (
                      <>
                        <button onClick={() => saveEdit(l.id)} style={buttonPrimary} type="button">Save</button>
                        <button onClick={cancelEdit} style={buttonGhost} type="button">Cancel</button>
                      </>
                    ) : (
                      <button 
                        onClick={() => onDelete(l.id)} 
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
                        title="Delete lesson"
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <div role="dialog" aria-modal="true" onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '100%', background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Add lesson</div>
              <button onClick={() => setCreateOpen(false)} style={buttonGhost} type="button">Close</button>
            </div>
            <form onSubmit={onCreateLesson}>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {createError && <div style={{ color: '#fca5a5' }}>{createError}</div>}
                <div>
                  <label style={labelStyle}>Title</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Lesson 1: Basics" style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Content (optional)</label>
                  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={4} placeholder="Lesson overview" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={labelStyle}>Duration (minutes)</label>
                  <input type="number" min={0} value={newDuration} onChange={(e) => setNewDuration(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ padding: 16, borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setCreateOpen(false)} style={buttonGhost}>Cancel</button>
                <button type="submit" disabled={creating || !newTitle.trim()} style={buttonPrimary}>{creating ? 'Creating…' : 'Create lesson'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
