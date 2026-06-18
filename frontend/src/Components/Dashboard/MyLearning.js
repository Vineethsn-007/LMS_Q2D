import React from 'react';
import { Play, CheckCircle2, Circle, FileText, ChevronRight, HelpCircle } from 'lucide-react';
import './MyLearning.css';

const LESSONS = [
  { id: 1, title: "Intro to Advanced Types", duration: "12:30", status: "completed" },
  { id: 2, title: "Type Narrowing & Guards", duration: "18:45", status: "completed" },
  { id: 3, title: "Discriminated Unions", duration: "22:10", status: "completed" },
  { id: 4, title: "Generic Functions", duration: "19:20", status: "completed" },
  { id: 5, title: "Constrained Generics", duration: "16:40", status: "completed" },
  { id: 6, title: "Generic Classes & Interfaces", duration: "24:15", status: "completed" },
  { id: 7, title: "Mapped Types", duration: "20:30", status: "completed" },
  { id: 8, title: "Template Literal Types", duration: "17:50", status: "completed" },
  { id: 9, title: "Conditional Types", duration: "25:40", status: "completed" },
  { id: 10, title: "Infer Keyword Deep Dive", duration: "21:10", status: "completed" },
  { id: 11, title: "Recursive Types", duration: "19:00", status: "completed" },
  { id: 12, title: "Variadic Tuple Types", duration: "15:30", status: "completed" },
  { id: 13, title: "Custom Hooks Deep Dive", duration: "28:20", status: "active" },
  { id: 14, title: "Declaration Merging", duration: "14:45", status: "locked" },
  { id: 15, title: "Advanced Patterns Review", duration: "32:10", status: "locked" },
];

const MyLearning = () => {
  return (
    <div className="mylearning-container">
      
      {/* Sidebar: Curriculum */}
      <aside className="curriculum-sidebar">
        <div className="curriculum-header">
          <h2 className="course-title-small">Advanced React Patterns & Architecture</h2>
          <div className="curriculum-progress-info">
            <span>12 / 15 lessons</span>
            <span>80%</span>
          </div>
          <div className="curriculum-progress-bg">
            <div className="curriculum-progress-fill" style={{ width: '80%' }}></div>
          </div>
        </div>

        <div className="curriculum-list">
          {LESSONS.map((lesson) => (
            <div key={lesson.id} className={`lesson-item ${lesson.status === 'active' ? 'active' : ''}`}>
              <div className={`lesson-icon ${lesson.status}`}>
                {lesson.status === 'completed' && <CheckCircle2 size={16} fill="currentColor" color="white" />}
                {lesson.status === 'active' && <Play size={16} fill="currentColor" />}
                {lesson.status === 'locked' && <Circle size={16} />}
              </div>
              <div className="lesson-details">
                <span className="lesson-title">{lesson.id}. {lesson.title}</span>
                <span className="lesson-duration">{lesson.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content: Video & Tabs */}
      <main className="learning-content">
        
        <div className="video-section">
          <div className="video-player">
            <div className="play-button-overlay">
              <Play size={24} fill="currentColor" />
            </div>
            <div className="video-overlay-text">Custom Hooks Deep Dive</div>
            <div className="video-overlay-time">28:20</div>
            
            <div className="video-progress-container">
              <div className="video-progress-bar">
                <div className="video-progress-fill"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lesson-meta-area">
          <div className="lesson-header-row">
            <div>
              <h1 className="lesson-main-title">Custom Hooks Deep Dive</h1>
              <span className="lesson-subtitle">Lesson 13 · Advanced React Patterns</span>
            </div>
            <div className="lesson-actions">
              <button className="btn-secondary">
                <FileText size={16} /> Resources
              </button>
              <button className="btn-primary">
                Next Lesson <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="lesson-tabs">
            <div className="tab active">Overview</div>
            <div className="tab">Notes</div>
            <div className="tab">Q&A</div>
            <div className="tab">Discussion</div>
          </div>

          <div className="tab-content-box">
            <h3>In this lesson</h3>
            <p>
              Explore advanced patterns for building reusable custom hooks in React. We cover state management, 
              side effects, cleanup functions, and how to design hooks with flexible APIs that compose well across 
              different components.
            </p>
            <ul>
              <li>Building hooks with complex state logic</li>
              <li>Managing subscriptions and cleanup correctly</li>
              <li>Composing multiple hooks together</li>
              <li>Testing custom hooks with React Testing Library</li>
            </ul>
          </div>
        </div>
        
      </main>

    </div>
  );
};

export default MyLearning;
