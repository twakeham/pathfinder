import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const LESSONS_API_BASE = '/api/courses/lessons/';

export default function LessonEditor() {
  const { lessonId } = useParams();
  const { apiFetch } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    content: '', 
    duration_minutes: '', 
    is_published: false 
  });

  // Auto-save functionality
  const autoSaveTimeout = useRef(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Textarea ref for markdown toolbar
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  
  // File selector modal state
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [courseFiles, setCourseFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`${LESSONS_API_BASE}${lessonId}/`);
        if (!res.ok) throw new Error(`Failed to load lesson (${res.status})`);
        const data = await res.json();
        setLesson(data);
        setForm({ 
          title: data.title || '', 
          content: data.content || '',
          duration_minutes: data.duration_minutes ?? '', 
          is_published: !!data.is_published 
        });
        setLastSaved(new Date());
      } catch (e) {
        setError(e.message || 'Error loading lesson');
      } finally {
        setLoading(false);
      }
    };
    loadLesson();
  }, [lessonId, apiFetch]);

  const canSave = useMemo(() => !!form.title.trim(), [form.title]);
  
  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    
    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    autoSaveTimeout.current = setTimeout(() => {
      saveLesson();
    }, 2000);
  };

  const saveLesson = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${LESSONS_API_BASE}${lessonId}/`, {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
          is_published: !!form.is_published,
        })
      });
      if (!res.ok) throw new Error(`Failed to save lesson (${res.status})`);
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (e) {
      setError(e.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  // Clean up auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, []);

  // Markdown toolbar functions
  const applyMarkdown = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.content.substring(start, end);
    
    let newText;
    if (selectedText) {
      // Apply formatting to selected text
      newText = form.content.substring(0, start) + before + selectedText + after + form.content.substring(end);
    } else {
      // Insert formatting at cursor position
      newText = form.content.substring(0, start) + before + after + form.content.substring(end);
    }
    
    setForm(prev => ({ ...prev, content: newText }));
    setHasUnsavedChanges(true);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText ? start + before.length + selectedText.length + after.length : start + before.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);

    // Trigger auto-save
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    autoSaveTimeout.current = setTimeout(() => {
      saveLesson();
    }, 2000);
  };

  const insertAtCursor = (text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = form.content.substring(0, start) + text + form.content.substring(start);
    
    setForm(prev => ({ ...prev, content: newText }));
    setHasUnsavedChanges(true);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);

    // Trigger auto-save
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    autoSaveTimeout.current = setTimeout(() => {
      saveLesson();
    }, 2000);
  };

  // Handle clicks in the preview area to properly handle file download links
  const handlePreviewClick = (event) => {
    // Check if the clicked element is a link
    if (event.target.tagName === 'A') {
      const href = event.target.getAttribute('href');
      
      // If it's a media file link, prevent default and handle manually
      if (href && (href.includes('/media/') || href.includes('localhost:8000/media/'))) {
        event.preventDefault();
        event.stopPropagation();
        
        // Open the file in a new tab for download
        window.open(href, '_blank');
        return;
      }
    }
  };

  // Load all files for the current course
  const loadCourseFiles = async () => {
    if (!lesson) return;
    
    setLoadingFiles(true);
    try {
      // Fetch all files from the media directory for this course
      const response = await apiFetch(`/api/courses/files/${lesson.course}/`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourseFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading course files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !lesson) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to course/module/lesson folder structure
      const uploadPath = `${lesson.course}/${lesson.module}/${lessonId}`;
      formData.append('path', uploadPath);
      
      const res = await apiFetch('/api/courses/upload/', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const data = await res.json();
      
      // Determine if it's an image or other file
      const isImage = file.type.startsWith('image/');
      const fileName = file.name;
      const fileUrl = data.url || `/uploads/${uploadPath}/${fileName}`;
      
      // Insert appropriate markdown
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        let markdownText;
        
        if (isImage) {
          markdownText = `![${fileName}](${fileUrl})`;
        } else {
          markdownText = `[${fileName}](${fileUrl})`;
        }
        
        const newText = form.content.substring(0, start) + markdownText + form.content.substring(start);
        setForm(prev => ({ ...prev, content: newText }));
        setHasUnsavedChanges(true);
        
        // Focus back and position cursor
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + markdownText.length, start + markdownText.length);
        }, 0);
        
        // Trigger auto-save
        if (autoSaveTimeout.current) {
          clearTimeout(autoSaveTimeout.current);
        }
        autoSaveTimeout.current = setTimeout(() => {
          saveLesson();
        }, 2000);
      }
    } catch (e) {
      setError(e.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Function to insert selected file into markdown
  const insertSelectedFile = (file) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const isImage = file.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
      
      let markdownText;
      if (isImage) {
        markdownText = `![${file.filename}](${file.url})`;
      } else {
        markdownText = `[${file.filename}](${file.url})`;
      }
      
      const newText = form.content.substring(0, start) + markdownText + form.content.substring(start);
      setForm(prev => ({ ...prev, content: newText }));
      setHasUnsavedChanges(true);
      
      // Focus back to textarea and position cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + markdownText.length, start + markdownText.length);
      }, 100);
    }
    
    setShowFileSelector(false);
  };

  // Toggle section collapse state
  const toggleSectionCollapse = (sectionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
        `}
      </style>
      <div style={{ padding: '16px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        {!loading && lesson && (
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
              to={`/instructor/courses/${lesson.course}/edit`}
              style={{ 
                color: '#93c5fd', 
                textDecoration: 'none',
                fontSize: 14
              }}
            >
              {lesson.course_title || 'Course'}
            </Link>
            <span style={{ color: '#6b7280' }}>›</span>
            <Link 
              to={`/instructor/modules/${lesson.module}/edit`}
              style={{ 
                color: '#93c5fd', 
                textDecoration: 'none',
                fontSize: 14
              }}
            >
              {lesson.module_title || 'Module'}
            </Link>
            <span style={{ color: '#6b7280' }}>›</span>
            <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{lesson.title}</span>
          </div>
        )}
        <h3 style={{ margin: 0, color: '#e5e7eb' }}>Lesson Editor</h3>
      </div>

      {loading ? (
        <div style={{ 
          padding: 60, 
          textAlign: 'center', 
          color: '#9ca3af',
          background: '#111827',
          borderRadius: 12,
          border: '1px solid #1f2937'
        }}>
          Loading lesson…
        </div>
      ) : (
  <div style={{ display: 'grid', gap: 32 }}>
          {/* Lesson metadata */}
          <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: 24, borderBottom: '1px solid #1f2937' }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Lesson Settings</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 200px', gap: 20, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, color: '#9ca3af', marginBottom: 6 }}>Title</label>
                  <input 
                    value={form.title} 
                    onChange={setField('title')} 
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      borderRadius: 8, 
                      border: '1px solid #374151', 
                      background: '#0b1220', 
                      color: '#e5e7eb',
                      fontSize: 16,
                      boxSizing: 'border-box'
                    }} 
                    placeholder="Enter lesson title..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 14, color: '#9ca3af', marginBottom: 6 }}>Duration (min)</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={form.duration_minutes} 
                    onChange={setField('duration_minutes')} 
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      borderRadius: 8, 
                      border: '1px solid #374151', 
                      background: '#0b1220', 
                      color: '#e5e7eb',
                      boxSizing: 'border-box'
                    }} 
                    placeholder="30"
                  />
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ 
                      color: form.is_published ? '#10b981' : '#9ca3af', 
                      fontSize: 14,
                      fontWeight: 500,
                      userSelect: 'none'
                    }}>
                      {form.is_published ? 'Published' : 'Draft'}
                    </span>
                    <div 
                      onClick={() => setForm(prev => ({ ...prev, is_published: !prev.is_published }))}
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
                  </div>
                  <button 
                    onClick={saveLesson} 
                    disabled={saving || !canSave} 
                    style={{ 
                      padding: '12px 20px', 
                      borderRadius: 8, 
                      background: canSave ? '#2563eb' : '#374151', 
                      color: 'white', 
                      border: 'none',
                      cursor: canSave ? 'pointer' : 'not-allowed',
                      fontSize: 14,
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
              
              {error && <div style={{ marginTop: 12, color: '#ef4444', fontSize: 14 }}>{error}</div>}
              
              {/* Auto-save status */}
              <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
                {saving ? (
                  'Saving changes...'
                ) : hasUnsavedChanges ? (
                  'Unsaved changes'
                ) : lastSaved ? (
                  `Last saved at ${lastSaved.toLocaleTimeString()}`
                ) : null}
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: 24, borderBottom: '1px solid #1f2937' }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Content</div>
              <div style={{ fontSize: 14, color: '#9ca3af' }}>
                Write your lesson content using Markdown formatting
              </div>
            </div>
            
            <div style={{ padding: 24 }}>
              {/* Markdown Toolbar */}
              <div style={{ 
                marginBottom: 16, 
                padding: 12, 
                background: '#1f2937', 
                border: '1px solid #374151', 
                borderRadius: 8,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center'
              }}>
                {/* Text Formatting */}
                <button
                  type="button"
                  onClick={() => applyMarkdown('**', '**')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#e5e7eb',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                
                <button
                  type="button"
                  onClick={() => applyMarkdown('*', '*')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#e5e7eb',
                    fontSize: 12,
                    fontStyle: 'italic',
                    cursor: 'pointer'
                  }}
                  title="Italic"
                >
                  I
                </button>
                
                <button
                  type="button"
                  onClick={() => applyMarkdown('`', '`')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#fbbf24',
                    fontSize: 12,
                    fontFamily: 'Monaco, Consolas, monospace',
                    cursor: 'pointer'
                  }}
                  title="Inline Code"
                >
                  {'</>'}
                </button>

                <div style={{ width: 1, height: 20, background: '#4b5563', margin: '0 4px' }} />

                {/* Headers */}
                <button
                  type="button"
                  onClick={() => applyMarkdown('# ', '')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#e5e7eb',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Heading 1"
                >
                  H1
                </button>
                
                <button
                  type="button"
                  onClick={() => applyMarkdown('## ', '')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#e5e7eb',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Heading 2"
                >
                  H2
                </button>
                
                <button
                  type="button"
                  onClick={() => applyMarkdown('### ', '')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#e5e7eb',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Heading 3"
                >
                  H3
                </button>

                <div style={{ width: 1, height: 20, background: '#4b5563', margin: '0 4px' }} />

                {/* Lists and Links */}
                <button
                  type="button"
                  onClick={() => applyMarkdown('- ', '')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#e5e7eb',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                  title="Bullet List"
                >
                  • List
                </button>
                
                <button
                  type="button"
                  onClick={() => applyMarkdown('[', '](url)')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#60a5fa',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                  title="Link"
                >
                  🔗 Link
                </button>
                
                <button
                  type="button"
                  onClick={() => applyMarkdown('![alt text](', ')')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#34d399',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                  title="Image"
                >
                  🖼️ Image
                </button>

                <div style={{ width: 1, height: 20, background: '#4b5563', margin: '0 4px' }} />

                {/* Code Block */}
                <button
                  type="button"
                  onClick={() => insertAtCursor('\n```javascript\n// Your code here\n```\n')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#fbbf24',
                    fontSize: 12,
                    fontFamily: 'Monaco, Consolas, monospace',
                    cursor: 'pointer'
                  }}
                  title="Code Block"
                >
                  {'{ }'} Code
                </button>

                <div style={{ width: 1, height: 20, background: '#4b5563', margin: '0 4px' }} />

                {/* File Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: uploading ? '#6b7280' : '#374151',
                    color: uploading ? '#9ca3af' : '#a78bfa',
                    fontSize: 12,
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                  title="Upload File"
                >
                  {uploading ? '📤 Uploading...' : '📁 Upload'}
                </button>

                {/* File Selector */}
                <button
                  type="button"
                  onClick={() => {
                    setShowFileSelector(true);
                    loadCourseFiles();
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #4b5563',
                    background: '#374151',
                    color: '#10b981',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                  title="Browse Uploaded Files"
                >
                  📂 Browse
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.txt,.md"
                />
              </div>

              <textarea
                ref={textareaRef}
                value={form.content}
                onChange={setField('content')}
                placeholder="# Lesson Title

Write your lesson content here using Markdown...

## Section 1
- Point 1
- Point 2

## Section 2
```javascript
// Code example
console.log('Hello World');
```

![Image description](image-url)

[Link text](https://example.com)"
                style={{
                  width: '100%',
                  minHeight: 400,
                  padding: '16px',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  background: '#0b1220',
                  color: '#e5e7eb',
                  fontSize: 14,
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              
              <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
                <strong>Markdown Quick Reference:</strong> 
                <span style={{ marginLeft: 8 }}>
                  **bold** | *italic* | `code` | # heading | - list | [link](url) | ![image](url)
                </span>
              </div>
            </div>
          </div>

          {/* Content Preview */}
          {form.content && (
            <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: 24, borderBottom: '1px solid #1f2937' }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Preview</div>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>
                  Live preview of your rendered markdown content
                </div>
              </div>
              
              <div style={{ padding: 24 }}>
                <div
                  style={{
                    background: '#0b1220',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    padding: 24,
                    minHeight: 200,
                    color: '#e5e7eb',
                    lineHeight: 1.6
                  }}
                  onClick={handlePreviewClick}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
                />
              </div>
            </div>
          )}

          {/* Quizzes Manager */}
          <div style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
            <QuizManager lessonId={lessonId} />
          </div>
        </div>
      )}

      {/* File Selector Modal */}
      {showFileSelector && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFileSelector(false);
            }
          }}
        >
          <div
            style={{
              background: '#1f2937',
              borderRadius: 12,
              width: '50%',
              height: '50vh',
              border: '1px solid #374151',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #374151',
              flexShrink: 0
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#f3f4f6',
                fontSize: 20,
                fontWeight: 600
              }}>
                Browse Course Files
              </h3>
              <button
                onClick={() => setShowFileSelector(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            <div 
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '16px 24px 24px 24px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#4b5563 #1f2937'
              }}
              className="custom-scrollbar"
            >

            {loadingFiles ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 40,
                color: '#9ca3af'
              }}>
                Loading files...
              </div>
            ) : Object.keys(courseFiles).length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 40,
                color: '#9ca3af'
              }}>
                No files found for this course.
              </div>
            ) : (
              <div style={{ width: '100%', minWidth: 0 }}>
                {Object.entries(courseFiles).map(([locationKey, locationData]) => {
                  const isCollapsed = collapsedSections[locationKey];
                  
                  return (
                    <div key={locationKey} style={{ marginBottom: 24 }}>
                      <h4 
                        onClick={() => toggleSectionCollapse(locationKey)}
                        style={{ 
                          color: '#60a5fa',
                          fontSize: 16,
                          fontWeight: 600,
                          margin: '0 0 12px 0',
                          borderBottom: '1px solid #374151',
                          paddingBottom: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          userSelect: 'none'
                        }}
                      >
                        <span style={{ 
                          transition: 'transform 0.2s',
                          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'
                        }}>
                          ▼
                        </span>
                        📁 {locationKey}
                      </h4>
                      
                      {!isCollapsed && (
                        <div style={{ 
                          display: 'grid',
                          gap: 8,
                          paddingLeft: 16
                        }}>
                      {locationData.files.map((file, fileIndex) => {
                        const isImage = file.filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
                        const fileSize = (file.size / 1024).toFixed(1) + ' KB';
                        
                        return (
                          <div
                            key={fileIndex}
                            onClick={() => insertSelectedFile(file)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: 12,
                              background: '#374151',
                              borderRadius: 8,
                              cursor: 'pointer',
                              border: '1px solid #4b5563',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#4b5563';
                              e.target.style.borderColor = '#6b7280';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = '#374151';
                              e.target.style.borderColor = '#4b5563';
                            }}
                          >
                            <span style={{ fontSize: 16 }}>
                              {isImage ? '🖼️' : '📄'}
                            </span>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                color: '#f3f4f6',
                                fontWeight: 500,
                                marginBottom: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {file.filename}
                              </div>
                              <div style={{ 
                                color: '#9ca3af',
                                fontSize: 12
                              }}>
                                {fileSize} • {new Date(file.uploaded_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );

  // Simple markdown renderer (basic implementation)
  function renderMarkdown(text) {
    if (!text) return '';
    
    let html = text
      // Images (process before links to avoid conflicts)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block;" />')
      
      // Links - handle media files and external links differently
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
        // Check if it's a media file link (internal upload)
        if (url.startsWith('/media/') || url.startsWith('media/')) {
          // For media files, use full backend URL and force download
          const fullUrl = url.startsWith('/') ? `http://localhost:8000${url}` : `http://localhost:8000/${url}`;
          return `<a href="${fullUrl}" style="color: #60a5fa; text-decoration: underline;" target="_blank" rel="noopener noreferrer" download>${linkText}</a>`;
        } else {
          // For external links, use as-is
          return `<a href="${url}" style="color: #60a5fa; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        }
      })
      
      // Code blocks (process early to avoid interference)
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 16px; margin: 16px 0; overflow-x: auto;"><code style="color: #e5e7eb; font-family: Monaco, Consolas, monospace; font-size: 13px; line-height: 1.4;">$2</code></pre>')
      
      // Headers
      .replace(/^### (.*$)/gim, '<h3 style="color: #f3f4f6; font-size: 20px; font-weight: 600; margin: 24px 0 12px 0;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #f3f4f6; font-size: 24px; font-weight: 600; margin: 32px 0 16px 0;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color: #f3f4f6; font-size: 28px; font-weight: 700; margin: 32px 0 20px 0;">$1</h1>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code style="background: #374151; color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-family: Monaco, Consolas, monospace; font-size: 13px;">$1</code>')
      
      // Bold and italic
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 600; color: #f3f4f6;">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em style="font-style: italic; color: #d1d5db;">$1</em>')
      
      // Unordered lists
      .replace(/^\- (.+$)/gim, '<li style="margin: 4px 0; color: #e5e7eb;">$1</li>')
      
      // Line breaks (process last)
      .replace(/\n/g, '<br />');
    
    // Wrap consecutive list items in ul tags
    html = html.replace(/(<li[^>]*>.*?<\/li>(?:\s*<br\s*\/?>)*)+/g, (match) => {
      return '<ul style="margin: 12px 0; padding-left: 24px; list-style-type: disc;">' + 
             match.replace(/<br\s*\/?>/g, '') + 
             '</ul>';
    });
    
    // Clean up extra breaks around block elements
    html = html.replace(/(<\/h[1-6]>)<br\s*\/?>/g, '$1');
    html = html.replace(/(<\/pre>)<br\s*\/?>/g, '$1');
    html = html.replace(/(<\/ul>)<br\s*\/?>/g, '$1');
    html = html.replace(/(<img[^>]*>)<br\s*\/?>/g, '$1');
    html = html.replace(/<br\s*\/?>\s*(<img[^>]*>)/g, '$1');
    
    return html;
  }
}

function QuizManager({ lessonId }) {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createError, setCreateError] = useState('');

  const [dragIndex, setDragIndex] = useState(null);

  const listUrl = `/api/courses/lessons/${lessonId}/quizzes/`;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(listUrl);
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch {}
        throw new Error(`Failed to load quizzes (${res.status}): ${body || res.statusText}`);
      }
      const data = await res.json();
      setQuizzes((data || []).slice().sort((a, b) => (a.order - b.order) || (a.id - b.id)));
    } catch (e) {
      setError(e.message || 'Error loading quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [lessonId]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        lesson: Number(lessonId),
        title: newTitle.trim(),
        description: newDesc,
        order: (quizzes.length ? Math.max(...quizzes.map(q => q.order || 0)) + 1 : 1)
      };
      const res = await apiFetch('/api/courses/quizzes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch {}
        throw new Error(`Failed to create quiz (${res.status}): ${body || res.statusText}`);
      }
      setNewTitle('');
      setNewDesc('');
      setCreateOpen(false);
      load();
    } catch (e) {
      setCreateError(e.message || 'Error creating quiz');
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      const res = await apiFetch(`/api/courses/quizzes/${id}/`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        let body = '';
        try { body = await res.text(); } catch {}
        throw new Error(`Failed to delete quiz (${res.status}): ${body || res.statusText}`);
      }
      load();
    } catch (e) {
      setError(e.message || 'Error deleting quiz');
    }
  };

  const reorder = (fromIdx, toIdx) => {
    if (fromIdx === null || toIdx === null || fromIdx === toIdx) return null;
    const next = quizzes.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setQuizzes(next);
    return next;
  };

  const persistOrder = async (list) => {
    try {
      const arr = Array.isArray(list) ? list : quizzes;
      const updates = arr.map((q, idx) => ({ id: q.id, order: idx + 1 }));
      await Promise.all(
        updates.map(u => apiFetch(`/api/courses/quizzes/${u.id}/`, {
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
          <div style={{ fontSize: 18, fontWeight: 700 }}>Quizzes</div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#9ca3af' }}>Create, delete, reorder</div>
        </div>
        <button onClick={() => { setCreateError(''); setCreateOpen(true); }} type="button" style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1f2937' }}>Add quiz</button>
      </div>

      <div style={{ padding: 16 }}>
        {error && <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>}

        {loading ? (
          <div style={{ color: '#9ca3af' }}>Loading quizzes…</div>
        ) : quizzes.length === 0 ? (
          <div style={{ color: '#9ca3af' }}>No quizzes yet.</div>
        ) : (
          <div>
            {quizzes.map((q, idx) => (
              <div
                key={q.id}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async () => { const next = reorder(dragIndex, idx); setDragIndex(null); if (next) await persistOrder(next); }}
                style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 12px', border: '1px dashed #1f2937', borderRadius: 10, marginBottom: 8, background: '#0b1220' }}
                title="Drag to reorder"
              >
                <div style={{ cursor: 'grab', userSelect: 'none', color: '#9ca3af' }}>≡</div>
                <div>
                  <div 
                    onClick={() => navigate(`/instructor/quizzes/${q.id}/edit`)}
                    style={{ 
                      fontWeight: 600, 
                      color: '#93c5fd', 
                      cursor: 'pointer',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {q.title}
                  </div>
                  {q.description && <div style={{ color: '#9ca3af', fontSize: 13 }}>{q.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => onDelete(q.id)} 
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
                    title="Delete quiz"
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
              <div style={{ fontSize: 18, fontWeight: 700 }}>Add quiz</div>
              <button onClick={() => setCreateOpen(false)} type="button" style={{ padding: '10px 14px', borderRadius: 8, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' }}>Close</button>
            </div>
            <form onSubmit={onCreate}>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {createError && <div style={{ color: '#fca5a5' }}>{createError}</div>}
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' }}>Title</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Chapter Quiz" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textAlign: 'left' }}>Description (optional)</label>
                  <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={4} placeholder="Short description" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #374151', background: '#0b1220', color: '#e5e7eb', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ padding: 16, borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setCreateOpen(false)} style={{ padding: '10px 14px', borderRadius: 8, background: 'transparent', color: '#93c5fd', border: '1px solid #1f2937' }}>Cancel</button>
                <button type="submit" disabled={creating || !newTitle.trim()} style={{ padding: '10px 14px', borderRadius: 8, background: '#2563eb', color: 'white', border: '1px solid #1f2937' }}>{creating ? 'Creating…' : 'Create quiz'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
