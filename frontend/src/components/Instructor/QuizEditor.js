import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function QuizEditor() {
  const { quizId } = useParams();
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lessonInfo, setLessonInfo] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    is_published: false,
    attempts_allowed: '',
    time_limit_minutes: '',
    instructions: '',
    randomize_questions: false,
    show_results_immediately: true,
    questions_to_show: '',
  });
  const canSave = useMemo(() => !!form.title.trim(), [form.title]);

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [qError, setQError] = useState('');
  const [qLoading, setQLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState(null);
  
  // Helper to detect temp questions
  const isTempId = (id) => typeof id !== 'number';

  // Helpers for unsaved-changes detection
  const getQuestionById = (id) => (questions || []).find(q => q.id === id);
  const arraysEqual = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return false; }
    return true;
  };

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmResolverRef = useRef(null);
  const promptSave = (message) => new Promise((resolve) => {
    setConfirmMessage(message || 'You have unsaved changes. Save before continuing?');
    setConfirmOpen(true);
    confirmResolverRef.current = resolve;
  });
  const handleConfirm = (action) => {
    const resolve = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setConfirmOpen(false);
    if (resolve) resolve(action); // 'save' | 'discard' | 'cancel'
  };
  const hasUnsavedChanges = (originalQ, edited) => {
    if (!originalQ || !edited) return false;
    const origText = (originalQ.text || '').trim();
    const editText = (edited.text || '').trim();
    if (origText !== editText) return true;
    const origType = originalQ.question_type || 'mcq';
    if ((edited.question_type || 'mcq') !== origType) return true;
    if (origType === 'mcq') {
      const origChoices = (originalQ.choices || []).map(c => ({ text: (c.text || '').trim(), is_correct: !!c.is_correct }));
      const editChoices = (edited.choices || [])
        .filter(c => (c.text || '').trim().length > 0)
        .map(c => ({ text: (c.text || '').trim(), is_correct: !!c.is_correct }));
      if (origChoices.length !== editChoices.length) return true;
      for (let i = 0; i < editChoices.length; i++) {
        if (!origChoices[i]) return true;
        if (origChoices[i].text !== editChoices[i].text) return true;
        if (origChoices[i].is_correct !== editChoices[i].is_correct) return true;
      }
      return false;
    } else {
      const origAnswers = Array.isArray((originalQ.data || {}).answers)
        ? (originalQ.data.answers || []).map(a => (a || '').trim()).filter(Boolean)
        : [];
      const editAnswers = (edited.answers || []).map(a => (a || '').trim()).filter(Boolean);
      if (!arraysEqual(origAnswers, editAnswers)) return true;
      return false;
    }
  };

  // Load quiz details
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/courses/quizzes/${quizId}/`);
        if (!res.ok) throw new Error(`Failed to load quiz (${res.status})`);
        const data = await res.json();
        if (!ignore) {
          setQuiz(data);
          setForm({
            title: data.title || '',
            description: data.description || '',
            is_published: !!data.is_published,
            attempts_allowed: (data.attempts_allowed ?? '') === null ? '' : String(data.attempts_allowed ?? ''),
            time_limit_minutes: (data.time_limit_minutes ?? '') === null ? '' : String(data.time_limit_minutes ?? ''),
            instructions: data.instructions || '',
            randomize_questions: !!data.randomize_questions,
            show_results_immediately: data.show_results_immediately !== false,
            questions_to_show: (data.questions_to_show ?? '') === null ? '' : String(data.questions_to_show ?? ''),
          });
        }
      } catch (e) {
        if (!ignore) setError(e.message || 'Error loading quiz');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [quizId, apiFetch]);

  // Load lesson info for breadcrumb once quiz is loaded
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (quiz?.lesson) {
          const res = await apiFetch(`/api/courses/lessons/${quiz.lesson}/`);
          if (!ignore && res.ok) {
            const data = await res.json();
            setLessonInfo(data);
          }
        } else {
          setLessonInfo(null);
        }
      } catch {
        // non-blocking; breadcrumb will just not render
      }
    })();
    return () => { ignore = true; };
  }, [quiz?.lesson, apiFetch]);

  const loadQuestions = async () => {
    setQLoading(true);
    setQError('');
    try {
      const res = await apiFetch(`/api/courses/quizzes/${quizId}/questions/`);
      if (!res.ok) throw new Error(`Failed to load questions (${res.status})`);
      const data = await res.json();
      setQuestions((data || []).slice().sort((a, b) => (a.order - b.order) || (a.id - b.id)));
    } catch (e) {
      setQError(e.message || 'Error loading questions');
    } finally {
      setQLoading(false);
    }
  };

  useEffect(() => { loadQuestions(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [quizId]);

  const saveQuiz = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/courses/quizzes/${quizId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          is_published: !!form.is_published,
          attempts_allowed: form.attempts_allowed === '' ? null : Number(form.attempts_allowed),
          time_limit_minutes: form.time_limit_minutes === '' ? null : Number(form.time_limit_minutes),
          instructions: form.instructions || '',
          randomize_questions: !!form.randomize_questions,
          show_results_immediately: !!form.show_results_immediately,
          questions_to_show: form.questions_to_show === '' ? null : Number(form.questions_to_show),
        }),
      });
      if (!res.ok) throw new Error(`Failed to save quiz (${res.status})`);
      const data = await res.json();
      setQuiz(data);
    } catch (e) {
      setError(e.message || 'Error saving quiz');
    } finally {
      setSaving(false);
    }
  };

  const reorder = (fromIdx, toIdx) => {
    if (fromIdx === null || toIdx === null || fromIdx === toIdx) return null;
    const next = questions.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setQuestions(next);
    return next;
  };

  const persistOrder = async (list) => {
    try {
      const arr = Array.isArray(list) ? list : questions;
      // Only persist order for saved questions; assign contiguous order ignoring temp rows
      const saved = arr.filter(q => !isTempId(q.id));
      await Promise.all(
        saved.map((q, idx) => apiFetch(`/api/courses/quiz-questions/${q.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: idx + 1 }),
        }))
      );
      loadQuestions();
    } catch (e) {
      setQError(e.message || 'Error saving order');
    }
  };

  const onDeleteQuestion = async (id) => {
    // If temp, remove locally
    if (isTempId(id)) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (editingId === id) { setEditingId(null); setEdit(null); }
      return;
    }
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await apiFetch(`/api/courses/quiz-questions/${id}/`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(`Failed to delete question (${res.status})`);
      loadQuestions();
    } catch (e) {
      setQError(e.message || 'Error deleting question');
    }
  };

  // Create a temp new question inline (not yet saved)
  const addQuestionInline = async () => {
    // If currently editing another, check for unsaved changes
    if (editingId && edit) {
      const current = getQuestionById(editingId) || { id: editingId, text: '', question_type: 'mcq', choices: [], data: {} };
      if (hasUnsavedChanges(current, edit)) {
        const choice = await promptSave('You have unsaved changes. Save before adding a new question?');
        if (choice === 'save') { try { await saveEdit(current); } catch {} }
        else if (choice === 'discard') { cancelEdit(); }
        else { return; }
      } else {
        cancelEdit();
      }
    }
    const nextOrder = (questions.length ? Math.max(...questions.map(q => q.order || 0)) + 1 : 1);
    const tempId = `temp-${Date.now()}`;
    const temp = { id: tempId, text: '', question_type: 'mcq', choices: [], order: nextOrder };
    setQuestions(prev => [...prev, temp]);
    setEditingId(tempId);
    setEdit({
      text: '',
      question_type: 'mcq',
      choices: [ { text: '', is_correct: true }, { text: '', is_correct: false } ],
      answers: ['']
    });
  };

  // Inline edit helpers
  const startEdit = async (q) => {
    if (editingId && editingId !== q.id && edit) {
      const current = getQuestionById(editingId) || { id: editingId, text: '', question_type: 'mcq', choices: [], data: {} };
      if (hasUnsavedChanges(current, edit)) {
        const choice = await promptSave('You have unsaved changes. Save before switching questions?');
        if (choice === 'save') { try { await saveEdit(current); } catch {} }
        else if (choice === 'discard') { cancelEdit(); }
        else { return; }
      }
    }
    setEditingId(q.id);
    setEdit({
      text: q.text || '',
      question_type: q.question_type || 'mcq',
      choices: (q.choices || []).map(c => ({ id: c.id, text: c.text || '', is_correct: !!c.is_correct })),
      answers: Array.isArray((q.data || {}).answers) ? (q.data.answers || []).slice() : [''],
    });
  };

  const cancelEdit = () => {
    // If temp, remove it
    if (editingId && isTempId(editingId)) {
      setQuestions(prev => prev.filter(q => q.id !== editingId));
    }
    setEditingId(null);
    setEdit(null);
  };

  const saveEdit = async (q) => {
    if (!edit) return;
    const { text, question_type } = edit;
    if (!text.trim()) { setQError('Question text is required.'); return; }
    // Validate per type
    if (question_type === 'mcq') {
      const filled = (edit.choices || []).filter(c => c.text && c.text.trim());
      if (filled.length < 2) { setQError('MCQ requires at least two choices.'); return; }
      if (!filled.some(c => c.is_correct)) { setQError('MCQ requires at least one correct choice.'); return; }
    } else if (question_type === 'short') {
      const answers = (edit.answers || []).map(a => (a || '').trim()).filter(Boolean);
      if (answers.length === 0) { setQError('Short answer requires at least one acceptable answer.'); return; }
    }

    setQError('');
    try {
      const body = { text: text.trim(), question_type };
      if (question_type === 'short') {
        body.data = { answers: (edit.answers || []).map(a => (a || '').trim()).filter(Boolean), case_insensitive: true };
      } else {
        body.data = {};
      }

      // Create if temp; else update
      if (isTempId(q.id)) {
        const payload = {
          ...body,
          order: q.order || (questions.length ? Math.max(...questions.map(x => x.order || 0)) + 1 : 1),
        };
        if (question_type === 'mcq') {
          const filled = (edit.choices || []).filter(c => (c.text || '').trim());
          payload.choices = filled.map((c, idx) => ({ text: c.text.trim(), is_correct: !!c.is_correct, order: idx + 1 }));
        }
        const res = await apiFetch(`/api/courses/quizzes/${quizId}/questions/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let bodyTxt = '';
          try { bodyTxt = await res.text(); } catch {}
          throw new Error(`Failed to create question (${res.status}): ${bodyTxt || res.statusText}`);
        }
      } else {
        const qRes = await apiFetch(`/api/courses/quiz-questions/${q.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!qRes.ok) throw new Error(`Failed to save question (${qRes.status})`);
      }

      // 2) If MCQ, sync choices (create/update/delete)
      if (question_type === 'mcq') {
        // For temp just created, original choices are empty locally; after loadQuestions we'll get server state
        const original = isTempId(q.id) ? [] : (q.choices || []).map(c => ({ id: c.id, text: c.text, is_correct: !!c.is_correct }));
        const edited = (edit.choices || []).filter(c => (c.text || '').trim());
        const editedIds = new Set(edited.filter(c => c.id).map(c => c.id));
        const originalIds = new Set(original.map(c => c.id));

        // Deletes
        const toDelete = [...originalIds].filter(id => !editedIds.has(id));
        // Updates
        const toUpdate = edited.filter(c => c.id && original.some(o => o.id === c.id && (o.text !== c.text || o.is_correct !== c.is_correct)));
        // Creates
        const toCreate = edited.filter(c => !c.id);

        // Apply order as current index
        const orderMap = new Map();
        edited.forEach((c, idx) => { orderMap.set(c.id || `new-${idx}`, idx + 1); });

        // Perform API calls
        if (!isTempId(q.id)) {
          await Promise.all([
            ...toDelete.map(id => apiFetch(`/api/courses/quiz-choices/${id}/`, { method: 'DELETE' })),
            ...toUpdate.map(c => apiFetch(`/api/courses/quiz-choices/${c.id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: c.text.trim(), is_correct: !!c.is_correct, order: orderMap.get(c.id) || 0 }),
            })),
            ...toCreate.map((c, idx) => apiFetch(`/api/courses/quizzes/${quizId}/questions/${q.id}/choices/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: c.text.trim(), is_correct: !!c.is_correct, order: orderMap.get(`new-${idx}`) || (idx + 1) }),
            })),
          ]);
        }
      } else {
        // If changed from MCQ to short, optionally remove existing choices
        if (!isTempId(q.id) && (q.choices || []).length) {
          await Promise.all((q.choices || []).map(c => apiFetch(`/api/courses/quiz-choices/${c.id}/`, { method: 'DELETE' })));
        }
      }

      setEditingId(null);
      setEdit(null);
      await loadQuestions();
    } catch (e) {
      setQError(e.message || 'Error saving question');
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: 0, color: '#e5e7eb' }}>Edit Quiz</h3>
        {!loading && lessonInfo && (
          <div style={{
            fontSize: 14,
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8
          }}>
            <Link to="/instructor/courses" style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 14 }}>
              Courses
            </Link>
            <span style={{ color: '#6b7280' }}>›</span>
            <Link to={`/instructor/courses/${lessonInfo.course}/edit`} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 14 }}>
              {lessonInfo.course_title || 'Course'}
            </Link>
            <span style={{ color: '#6b7280' }}>›</span>
            <Link to={`/instructor/modules/${lessonInfo.module}/edit`} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 14 }}>
              {lessonInfo.module_title || 'Module'}
            </Link>
            <span style={{ color: '#6b7280' }}>›</span>
            <Link to={`/instructor/lessons/${lessonInfo.id}/edit`} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: 14 }}>
              {lessonInfo.title}
            </Link>
            <span style={{ color: '#6b7280' }}>›</span>
            <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{quiz?.title || 'Quiz'}</span>
          </div>
        )}
      </div>
      {loading ? (
        <div style={{ color: '#9ca3af' }}>Loading…</div>
      ) : error ? (
        <div style={{ color: '#fca5a5' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>

          {/* Quiz metadata */}
          <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Quiz details</div>
                <div style={{ color: '#9ca3af', fontSize: 13 }}>Title, description, and publish state</div>
              </div>
              {quiz?.lesson && (
                <button onClick={() => navigate(`/instructor/lessons/${quiz.lesson}/edit`)} type="button" style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' }}>Back to Lesson</button>
              )}
            </div>
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' }}>Title</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                  <input value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, is_published: !prev.is_published }))}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        background: form.is_published ? '#10b981' : '#374151',
                        border: '2px solid',
                        borderColor: form.is_published ? '#10b981' : '#6b7280',
                        position: 'relative',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        lineHeight: 0,
                        boxSizing: 'border-box'
                      }}
                      aria-pressed={!!form.is_published}
                      aria-label="Toggle published state"
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: form.is_published ? 24 : 4,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: 'white',
                          transform: 'translateY(-50%)',
                          transition: 'left 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                        }}
                      />
                    </button>
                    <span style={{ fontWeight: 600, color: form.is_published ? '#10b981' : '#9ca3af' }}>
                      {form.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' }}>Description</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button disabled={!canSave || saving} onClick={saveQuiz} style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1f2937' }}>{saving ? 'Saving…' : 'Save changes'}</button>
              </div>
            </div>
          </div>

          {/* Quiz options */}
          <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Quiz options</div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#9ca3af' }}>Attempts, time limit, instructions, and behavior</div>
              </div>
            </div>
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' }}>Instructions</label>
                <textarea rows={4} value={form.instructions} onChange={(e) => setForm(prev => ({ ...prev, instructions: e.target.value }))} placeholder="Shown before the quiz starts" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' }}>Attempts allowed (blank for unlimited)</label>
                  <input type="number" min="0" value={form.attempts_allowed} onChange={(e) => setForm(prev => ({ ...prev, attempts_allowed: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' }}>Time limit (minutes, blank for none)</label>
                  <input type="number" min="0" value={form.time_limit_minutes} onChange={(e) => setForm(prev => ({ ...prev, time_limit_minutes: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' }}>Questions to show per attempt (blank for all)</label>
                  <input type="number" min="1" value={form.questions_to_show} onChange={(e) => setForm(prev => ({ ...prev, questions_to_show: e.target.value }))} placeholder="e.g. 5" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} />
                </div>
                <div />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 160, color: '#9ca3af', fontSize: 13, textAlign: 'left' }}>Randomize questions</div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, randomize_questions: !prev.randomize_questions }))}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: form.randomize_questions ? '#10b981' : '#374151',
                      border: '2px solid',
                      borderColor: form.randomize_questions ? '#10b981' : '#6b7280',
                      position: 'relative',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      lineHeight: 0,
                      boxSizing: 'border-box'
                    }}
                    aria-pressed={!!form.randomize_questions}
                    aria-label="Toggle randomize questions"
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: form.randomize_questions ? 24 : 4,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'white',
                        transform: 'translateY(-50%)',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                  </button>
                  <span style={{ fontWeight: 600, color: form.randomize_questions ? '#10b981' : '#9ca3af' }}>
                    {form.randomize_questions ? 'On' : 'Off'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 180, color: '#9ca3af', fontSize: 13, textAlign: 'left' }}>Show results immediately</div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, show_results_immediately: !prev.show_results_immediately }))}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: form.show_results_immediately ? '#10b981' : '#374151',
                      border: '2px solid',
                      borderColor: form.show_results_immediately ? '#10b981' : '#6b7280',
                      position: 'relative',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      lineHeight: 0,
                      boxSizing: 'border-box'
                    }}
                    aria-pressed={!!form.show_results_immediately}
                    aria-label="Toggle show results immediately"
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: form.show_results_immediately ? 24 : 4,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'white',
                        transform: 'translateY(-50%)',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                  </button>
                  <span style={{ fontWeight: 600, color: form.show_results_immediately ? '#10b981' : '#9ca3af' }}>
                    {form.show_results_immediately ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button disabled={!canSave || saving} onClick={saveQuiz} style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1f2937' }}>{saving ? 'Saving…' : 'Save changes'}</button>
              </div>
            </div>
          </div>

          {/* Questions manager */}
          <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Questions</div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#9ca3af' }}>Create, delete, reorder</div>
              </div>
              <button onClick={addQuestionInline} type="button" style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1f2937' }}>Add question</button>
            </div>
            <div style={{ padding: 16 }}>
              {qError && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{qError}</div>}
              {qLoading ? (
                <div style={{ color: '#9ca3af' }}>Loading questions…</div>
              ) : questions.length === 0 ? (
                <div style={{ color: '#9ca3af' }}>No questions yet.</div>
              ) : (
                <div>
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      draggable={!isTempId(q.id)}
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async () => { const next = reorder(dragIndex, idx); setDragIndex(null); if (next) await persistOrder(next); }}
                      style={{ padding: '10px 12px', border: '1px dashed #1f2937', borderRadius: 10, marginBottom: 8, background: '#0b1220' }}
                      title="Drag to reorder"
                    >
                      {/* Header: handle, title/type, actions (stable position) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12, alignItems: 'center' }}>
                        <div style={{ cursor: 'grab', userSelect: 'none', color: '#9ca3af' }}>≡</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#e5e7eb' }}>{q.text || (editingId === q.id ? '(new question)' : '')}</div>
                          <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{q.question_type === 'mcq' ? 'Multiple choice' : 'Short answer'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {editingId === q.id ? (
                            <>
                              <button
                                onClick={cancelEdit}
                                style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#93c5fd', border: '1px solid #374151' }}
                                title="Cancel edit"
                                type="button"
                              >
                                ↩
                              </button>
                              <button
                                onClick={() => saveEdit(q)}
                                style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#10b981', border: '1px solid #1f2937', fontSize: 18, fontWeight: 700, lineHeight: 1 }}
                                title="Save changes"
                                type="button"
                              >
                                ✓
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(q)}
                              style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#93c5fd', border: '1px solid #374151' }}
                              title="Edit inline"
                              type="button"
                            >
                              ✎
                            </button>
                          )}
                          <button 
                            onClick={() => onDeleteQuestion(q.id)} 
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
                            title="Delete question"
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Editor body: rendered only in edit mode, below header */}
                      {editingId === q.id && edit && (
                        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '40px 1fr auto', columnGap: 12 }}>
                          <div style={{ gridColumn: '2 / 3', display: 'grid', gap: 10 }}>
                            <div>
                            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' }}>Question text</label>
                            <textarea value={edit.text} onChange={(e) => setEdit(prev => ({ ...prev, text: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input type="radio" name={`type-${q.id}`} value="mcq" checked={edit.question_type === 'mcq'} onChange={(e) => setEdit(prev => ({ ...prev, question_type: e.target.value }))} /> Multiple choice
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input type="radio" name={`type-${q.id}`} value="short" checked={edit.question_type === 'short'} onChange={(e) => setEdit(prev => ({ ...prev, question_type: e.target.value }))} /> Short answer
                            </label>
                          </div>
                          {edit.question_type === 'mcq' ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <label style={{ fontSize: 12, color: '#9ca3af' }}>Choices (mark correct)</label>
                                <button type="button" onClick={() => setEdit(prev => ({ ...prev, choices: [ ...(prev.choices || []), { text: '', is_correct: false } ] }))} style={{ padding: '6px 10px', borderRadius: 6, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' }}>Add choice</button>
                              </div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                {(edit.choices || []).map((c, i) => (
                                  <div key={c.id || i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" checked={!!c.is_correct} onChange={(e) => setEdit(prev => ({ ...prev, choices: prev.choices.map((p, idx) => idx === i ? { ...p, is_correct: e.target.checked } : p) }))} />
                                      <input value={c.text} onChange={(e) => setEdit(prev => ({ ...prev, choices: prev.choices.map((p, idx) => idx === i ? { ...p, text: e.target.value } : p) }))} placeholder={`Choice ${i + 1}`} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} />
                                      <button type="button" onClick={() => setEdit(prev => ({ ...prev, choices: prev.choices.length > 1 ? prev.choices.filter((_, idx) => idx !== i) : prev.choices }))} title="Remove" style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#ef4444', border: '1px solid #374151', fontSize: 20, fontWeight: 'bold', lineHeight: 1 }}>×</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <label style={{ fontSize: 12, color: '#9ca3af' }}>Acceptable answers</label>
                                <button type="button" onClick={() => setEdit(prev => ({ ...prev, answers: [ ...(prev.answers || []), '' ] }))} style={{ padding: '6px 10px', borderRadius: 6, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' }}>Add answer</button>
                              </div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                {(edit.answers || []).map((a, i) => (
                                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8 }}>
                                      <input value={a} onChange={(e) => setEdit(prev => ({ ...prev, answers: prev.answers.map((p, idx) => idx === i ? e.target.value : p) }))} placeholder={`Answer ${i + 1}`} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} />
                                      <button type="button" onClick={() => setEdit(prev => ({ ...prev, answers: prev.answers.length > 1 ? prev.answers.filter((_, idx) => idx !== i) : prev.answers }))} title="Remove" style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', color: '#ef4444', border: '1px solid #374151', fontSize: 20, fontWeight: 'bold', lineHeight: 1 }}>×</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* No footer buttons; use header actions for Cancel and Save */}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Creation modal removed; creation is inline */}
        </div>
      )}
      {confirmOpen && (
        <div role="dialog" aria-modal="true" onClick={() => handleConfirm('cancel')} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 520, maxWidth: '100%', background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #1f2937', fontWeight: 700 }}>Unsaved changes</div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 40, lineHeight: 1, color: '#fbbf24', textAlign: 'center' }}>⚠️</div>
                <div style={{ color: '#e5e7eb' }}>{confirmMessage}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button type="button" onClick={() => handleConfirm('discard')} style={{ padding: '10px 14px', borderRadius: 8, background: 'transparent', color: '#fca5a5', border: '1px solid #374151' }}>Discard</button>
                <button type="button" onClick={() => handleConfirm('save')} style={{ padding: '10px 14px', borderRadius: 8, background: '#10b981', color: 'white', border: '1px solid #1f2937' }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
