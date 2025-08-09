import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function QuestionEditor() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/courses/questions/${questionId}/`);
        if (!res.ok) throw new Error(`Failed to load question (${res.status})`);
        const data = await res.json();
        if (!ignore) setQuestion(data);
      } catch (e) {
        if (!ignore) setError(e.message || 'Error loading question');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [questionId, apiFetch]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/instructor/courses" style={{ color: '#93c5fd' }}>← Back to Courses</Link>
      </div>
      {loading ? (
        <div style={{ color: '#9ca3af' }}>Loading…</div>
      ) : error ? (
        <div style={{ color: '#fca5a5' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <h2 style={{ margin: 0 }}>Edit Question</h2>
          <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #1f2937' }}>
              <div style={{ fontWeight: 700 }}>{question?.text || 'Untitled Question'}</div>
              <div style={{ color: '#9ca3af', marginTop: 4 }}>{question?.question_type === 'mcq' ? 'Multiple choice' : 'Short answer'}</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ color: '#9ca3af' }}>Per-type editor coming next.</div>
              {question?.quiz && (
                <div style={{ marginTop: 12 }}>
                  <button onClick={() => navigate(`/instructor/quizzes/${question.quiz}/edit`)} type="button" style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' }}>Back to Quiz</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
