import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const COURSES_API_BASE = '/api/courses/courses/';

export default function CoursesList() {
  const { apiFetch, user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [published, setPublished] = useState('all'); // all | published | unpublished

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPublished, setNewPublished] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const debouncer = useRef(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        // Support common search param names; backend will ignore unknown ones
        params.set('search', query.trim());
        params.set('q', query.trim());
        params.set('title__icontains', query.trim());
      }
      if (published === 'published') params.set('is_published', 'true');
      if (published === 'unpublished') params.set('is_published', 'false');

      const url = `${COURSES_API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await apiFetch(url);
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch {}
        const msg = `Failed to load courses (${res.status}): ${body || res.statusText}`;
        console.error(msg);
        throw new Error(msg);
      }
      const data = await res.json();
      // Some APIs return { results: [...] } when paginated; support both
      setCourses(Array.isArray(data) ? data : (data.results || []));
    } catch (e) {
      setError(e.message || 'Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce query changes slightly
    if (debouncer.current) clearTimeout(debouncer.current);
    debouncer.current = setTimeout(() => {
      fetchCourses();
    }, 300);
    return () => debouncer.current && clearTimeout(debouncer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, published]);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    // Client-side fallback filtering to ensure responsiveness even if server ignores params
    let items = courses;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(c =>
        (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
      );
    }
    if (published !== 'all') {
      const want = published === 'published';
      items = items.filter(c => !!c.is_published === want);
    }
    return items;
  }, [courses, query, published]);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newTitle.trim()) {
      setCreateError('Title is required');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: newTitle.trim(),
        description: newDesc,
        is_published: !!newPublished,
      };
      const res = await apiFetch(COURSES_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = 'Failed to create course';
        try {
          const data = await res.json();
          msg = data?.detail || JSON.stringify(data);
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewPublished(false);
      // Navigate to editor
      if (data?.id) {
        navigate(`/instructor/courses/${data.id}/edit`);
      } else {
        // Fallback: reload list
        fetchCourses();
      }
    } catch (e) {
      setCreateError(e.message || 'Error creating course');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '16px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#e5e7eb' }}>My Courses</h3>
        <button onClick={() => setShowModal(true)} style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1f2937' }}>New Course</button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or description"
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb' }}
        />
        <select value={published} onChange={(e) => setPublished(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb' }}>
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <button onClick={fetchCourses} disabled={loading} style={{ padding: '8px 12px', borderRadius: 8, background: '#111827', color: '#e5e7eb', border: '1px solid #374151' }}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: '#fca5a5' }}>
          {error}
        </div>
      )}

      <div style={{ border: '1px solid #1f2937', borderRadius: 8, overflow: 'hidden', background: '#0b1220' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px', padding: '10px 12px', background: '#0f172a', borderBottom: '1px solid #1f2937', fontWeight: 600, color: '#e5e7eb' }}>
          <div>Title</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 16, color: '#9ca3af' }}>No courses found.</div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px', padding: '12px', borderBottom: '1px solid #1f2937', alignItems: 'center', color: '#e5e7eb' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Link to={`/instructor/courses/${c.id}/edit`} className="course-title-link">
                    {c.title}
                  </Link>
                </div>
                {c.description && <div style={{ color: '#9ca3af', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description}</div>}
              </div>
              <div>
                <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 12, background: c.is_published ? '#064e3b' : '#1f2937', color: c.is_published ? '#6ee7b7' : '#e5e7eb', border: '1px solid #374151' }}>
                  {c.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div>
                <button onClick={() => navigate(`/instructor/courses/${c.id}/edit`)} style={{ padding: '6px 10px', borderRadius: 8, background: '#111827', color: 'white', border: '1px solid #374151' }}>Edit</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#111827', color: '#e5e7eb', borderRadius: 12, border: '1px solid #1f2937', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <form onSubmit={onCreate}>
              <div style={{ padding: 16, borderBottom: '1px solid #1f2937' }}>
                <h3 style={{ margin: 0 }}>New Course</h3>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {createError && <div style={{ color: '#fca5a5' }}>{createError}</div>}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 14, color: '#9ca3af' }}>Title</span>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Intro to Prompt Engineering" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 14, color: '#9ca3af' }}>Description</span>
                  <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={4} placeholder="Short description" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', resize: 'vertical' }} />
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#e5e7eb' }}>
                  <input type="checkbox" checked={newPublished} onChange={(e) => setNewPublished(e.target.checked)} />
                  <span>Publish immediately</span>
                </label>
              </div>
              <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #1f2937' }}>
                <button type="button" onClick={() => { setShowModal(false); setCreateError(''); }} disabled={creating} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' }}>Cancel</button>
                <button type="submit" disabled={creating} style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1f2937' }}>{creating ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
