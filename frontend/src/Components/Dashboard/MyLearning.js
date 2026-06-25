import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import './MyLearning.css';

const MyLearning = ({ course, onBack }) => {
  const [activeLesson, setActiveLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  
  useEffect(() => {
    if (course && course.modules_data && course.modules_data.length > 0) {
      // Find first lesson and expand first module
      setExpandedModules({ 0: true });
      for (const mod of course.modules_data) {
        if (mod.lessons && mod.lessons.length > 0) {
          setActiveLesson(mod.lessons[0]);
          return;
        }
      }
    } else {
      setActiveLesson(null);
    }
  }, [course]);

  const toggleModule = (mIndex) => {
    setExpandedModules(prev => ({ ...prev, [mIndex]: !prev[mIndex] }));
  };

  if (!course) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>No course selected. Please select a course from the Dashboard or Marketplace.</div>;
  }

  const hasModules = course.modules_data && course.modules_data.length > 0;

  const flattenedLessons = [];
  if (course && course.modules_data) {
    course.modules_data.forEach((mod, mIndex) => {
      if (mod.lessons) {
        mod.lessons.forEach((lesson) => {
          flattenedLessons.push({ moduleIndex: mIndex, lesson: lesson });
        });
      }
    });
  }
  const currentIndex = activeLesson ? flattenedLessons.findIndex(item => item.lesson.id === activeLesson.id) : -1;
  const prevLessonItem = currentIndex > 0 ? flattenedLessons[currentIndex - 1] : null;
  const nextLessonItem = currentIndex >= 0 && currentIndex < flattenedLessons.length - 1 ? flattenedLessons[currentIndex + 1] : null;

  const handlePrev = () => {
    if (prevLessonItem) {
      setActiveLesson(prevLessonItem.lesson);
      setExpandedModules(prev => ({ ...prev, [prevLessonItem.moduleIndex]: true }));
    }
  };

  const handleNext = () => {
    if (nextLessonItem) {
      setActiveLesson(nextLessonItem.lesson);
      setExpandedModules(prev => ({ ...prev, [nextLessonItem.moduleIndex]: true }));
    } else {
      const saved = JSON.parse(localStorage.getItem('sf_completed_courses') || '[]');
      if (course && course.id && !saved.includes(course.id)) {
        saved.push(course.id);
        localStorage.setItem('sf_completed_courses', JSON.stringify(saved));
      }
      if (onBack) onBack();
    }
  };
  
  return (
    <div className="mylearning-container" style={{ background: '#f8fafc', display: 'flex' }}>
      
      {/* Sidebar: Curriculum */}
      <aside className="curriculum-sidebar" style={{ width: '320px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div className="curriculum-header" style={{ padding: '2rem 1.5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', padding: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ← Back to Courses
          </button>
          <h2 className="course-title-small" style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.75rem', color: '#0f172a' }}>{course.title}</h2>
          <div className="curriculum-progress-bg" style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '0.5rem', width: '100%' }}>
            <div className="curriculum-progress-fill" style={{ width: '100%', background: '#3b82f6', height: '100%', borderRadius: '2px' }}></div>
          </div>
          <div className="curriculum-progress-info" style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
            <span>100% Completed</span>
          </div>
        </div>

        <div className="curriculum-list" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {hasModules ? (
            course.modules_data.map((mod, mIndex) => {
              const isExpanded = expandedModules[mIndex];
              return (
                <div key={mod.id || mIndex} className="module-accordion" style={{ marginBottom: '1rem' }}>
                  <button 
                    onClick={() => toggleModule(mIndex)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', padding: '0.85rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#1e293b', fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  >
                    {mIndex + 1}. {mod.title}
                    <span style={{ color: '#94a3b8', display: 'flex' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>
                  {isExpanded && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {mod.lessons.map((lesson, lIndex) => {
                        const isActive = activeLesson?.id === lesson.id;
                        const isVideo = lesson.contents?.some(c => c.type === 'video');
                        return (
                          <div 
                            key={lesson.id || lIndex} 
                            onClick={() => setActiveLesson(lesson)}
                            style={{ 
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                              padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', 
                              background: isActive ? '#3b82f6' : 'transparent',
                              color: isActive ? '#fff' : '#64748b',
                              fontWeight: isActive ? '600' : '500',
                              fontSize: '0.85rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {isVideo ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', background: isActive ? 'rgba(255,255,255,0.2)' : '#e2e8f0', borderRadius: '4px' }}>
                                  <Play size={12} fill={isActive ? '#fff' : '#94a3b8'} color={isActive ? '#fff' : '#94a3b8'} />
                                </div>
                              ) : (
                                <FileText size={16} color={isActive ? '#fff' : '#cbd5e1'} />
                              )}
                              <span>{lesson.title}</span>
                            </div>
                            <CheckCircle2 size={14} color={isActive ? '#fff' : '#22c55e'} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.9rem' }}>
              No dynamic modules available for this course.
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="learning-content" style={{ flex: 1, padding: '2.5rem 4rem', background: '#fff', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 1.5rem 0', textTransform: 'capitalize' }}>
            {activeLesson ? activeLesson.title : course.title}
          </h1>

          <div className="video-section" style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
            {activeLesson && activeLesson.contents && activeLesson.contents.length > 0 ? (
              <div className="lesson-contents">
                {(() => {
                  const content = activeLesson.contents[0];
                  if (!content) return null;
                  
                  if (content.type === 'video' && content.content_url) {
                    return (
                      <video controls style={{ width: '100%', display: 'block', maxHeight: '600px' }}>
                        <source src={`${process.env.REACT_APP_API_URL}${content.content_url}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    );
                  } else if (content.type === 'image' && content.content_url) {
                    return (
                      <img src={`${process.env.REACT_APP_API_URL}${content.content_url}`} alt={activeLesson.title} style={{ width: '100%', display: 'block', maxHeight: '600px', objectFit: 'contain', backgroundColor: '#f8fafc' }} />
                    );
                  } else if (content.type === 'text') {
                    return (
                      <div style={{ padding: '3rem', backgroundColor: '#fff', minHeight: '400px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                        {content.text_content}
                      </div>
                    );
                  } else if (content.type === 'pdf' && content.content_url) {
                    return (
                      <div style={{ padding: '4rem', backgroundColor: '#f8fafc', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <FileText size={64} color="#ef4444" />
                        <h3 style={{ margin: 0, color: '#0f172a' }}>PDF Document</h3>
                        <a href={`${process.env.REACT_APP_API_URL}${content.content_url}`} target="_blank" rel="noreferrer" style={{ padding: '0.75rem 2rem', background: '#3b82f6', color: '#fff', textDecoration: 'none', fontWeight: '600', borderRadius: '8px', marginTop: '1rem' }}>Download / View PDF</a>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : course.image_url ? (
              <div className="video-player-mock" style={{ backgroundImage: `url(${process.env.REACT_APP_API_URL}${course.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', paddingBottom: '56.25%', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Play size={32} fill="#fff" color="#fff" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="video-player-mock" style={{ background: '#1e293b', paddingBottom: '56.25%', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={32} fill="#fff" color="#fff" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button 
              onClick={handlePrev}
              disabled={!prevLessonItem}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: prevLessonItem ? '#f1f5f9' : '#f8fafc', 
                color: prevLessonItem ? '#334155' : '#cbd5e1', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: '600', 
                cursor: prevLessonItem ? 'pointer' : 'not-allowed', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              ← Previous Lesson
            </button>
            <button 
              onClick={handleNext}
              style={{ 
                padding: '0.75rem 1.5rem', 
                background: '#3b82f6', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: '600', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)',
                transition: 'all 0.2s'
              }}
            >
              {nextLessonItem ? 'Complete & Next →' : 'Complete Course ✓'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default MyLearning;
