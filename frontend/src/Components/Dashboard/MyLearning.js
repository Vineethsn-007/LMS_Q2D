import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Circle, FileText, ChevronRight, HelpCircle } from 'lucide-react';
import './MyLearning.css';

const MyLearning = ({ course }) => {
  const [activeLesson, setActiveLesson] = useState(null);
  
  useEffect(() => {
    if (course && course.modules_data && course.modules_data.length > 0) {
      // Find first lesson
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

  if (!course) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>No course selected. Please select a course from the Dashboard or Marketplace.</div>;
  }

  // Flatten lessons for the sidebar if using modules
  const hasModules = course.modules_data && course.modules_data.length > 0;
  
  return (
    <div className="mylearning-container">
      <aside className="curriculum-sidebar">
        <div className="curriculum-header">
          <h2 className="course-title-small">{course.title}</h2>
          <div className="curriculum-progress-info">
            <span>Progress</span>
            <span>0%</span>
          </div>
          <div className="curriculum-progress-bg">
            <div className="curriculum-progress-fill" style={{ width: '0%' }}></div>
          </div>
        </div>

        <div className="curriculum-list">
          {hasModules ? (
            course.modules_data.map((mod, mIndex) => (
              <div key={mod.id || mIndex} style={{ marginBottom: '1rem' }}>
                <h4 style={{ padding: '0 1.25rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Module {mIndex + 1}: {mod.title}
                </h4>
                {mod.lessons.map((lesson, lIndex) => (
                  <div 
                    key={lesson.id || lIndex} 
                    className={`lesson-item ${activeLesson?.id === lesson.id ? 'active' : ''}`}
                    onClick={() => setActiveLesson(lesson)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`lesson-icon ${activeLesson?.id === lesson.id ? 'active' : 'locked'}`}>
                      {activeLesson?.id === lesson.id ? <Play size={16} fill="currentColor" /> : <Circle size={16} />}
                    </div>
                    <div className="lesson-details">
                      <span className="lesson-title">{lesson.title}</span>
                      <span className="lesson-duration">{lesson.contents?.length || 0} items</span>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.9rem' }}>
              No dynamic modules available for this course. Check the overview for more details.
            </div>
          )}
        </div>
      </aside>

      <main className="learning-content">
        <div className="video-section">
          {activeLesson && activeLesson.contents && activeLesson.contents.length > 0 ? (
            <div className="lesson-contents" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeLesson.contents.map((content, cIndex) => {
                if (content.type === 'video' && content.content_url) {
                  return (
                    <video key={cIndex} controls style={{ width: '100%', maxHeight: '500px', backgroundColor: '#000', borderRadius: '12px' }}>
                      <source src={`${process.env.REACT_APP_API_URL}${content.content_url}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  );
                } else if (content.type === 'image' && content.content_url) {
                  return (
                    <img key={cIndex} src={`${process.env.REACT_APP_API_URL}${content.content_url}`} alt={activeLesson.title} style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  );
                } else if (content.type === 'text') {
                  return (
                    <div key={cIndex} style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      {content.text_content}
                    </div>
                  );
                } else if (content.type === 'pdf' && content.content_url) {
                  return (
                    <div key={cIndex} style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <FileText size={32} color="#ef4444" />
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>PDF Document</h4>
                        <a href={`${process.env.REACT_APP_API_URL}${content.content_url}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' }}>Download / View PDF</a>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ) : course.image_url ? (
            <div className="video-player" style={{ backgroundImage: `url(${process.env.REACT_APP_API_URL}${course.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="play-button-overlay">
                <Play size={24} fill="currentColor" />
              </div>
              <div className="video-overlay-text">{course.title}</div>
            </div>
          ) : (
            <div className="video-player">
              <div className="play-button-overlay">
                <Play size={24} fill="currentColor" />
              </div>
              <div className="video-overlay-text">{course.title}</div>
            </div>
          )}
        </div>

        <div className="lesson-meta-area">
          <div className="lesson-header-row">
            <div>
              <h1 className="lesson-main-title">{activeLesson ? activeLesson.title : course.title}</h1>
              <span className="lesson-subtitle">{course.category} · {course.hours} hours</span>
            </div>
          </div>

          <div className="lesson-tabs">
            <div className="tab active">Overview</div>
            <div className="tab">Notes</div>
            <div className="tab">Q&A</div>
            <div className="tab">Discussion</div>
          </div>

          <div className="tab-content-box">
            <h3>{activeLesson ? 'About this lesson' : 'About this course'}</h3>
            <p>{course.description}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyLearning;
