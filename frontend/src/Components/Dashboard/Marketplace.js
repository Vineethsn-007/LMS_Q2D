import React, { useState } from 'react';
import { Search, Filter, CheckCircle2, Clock, Sparkles, Star, Users } from 'lucide-react';
import './Marketplace.css';

const MOCK_COURSES = [
  {
    id: 1,
    title: "Advanced React Patterns & Architecture",
    author: "Dr. Sarah Chen",
    rating: 4.9,
    students: "12.4K",
    duration: "28h",
    tags: ["React", "TypeScript"],
    status: "Expert Approved",
    level: "Advanced"
  },
  {
    id: 2,
    title: "Machine Learning with Python & TensorFlow",
    author: "Prof. James Kim",
    rating: 4.8,
    students: "8.7K",
    duration: "42h",
    tags: ["Python", "ML"],
    status: "Expert Approved",
    level: "Intermediate"
  },
  {
    id: 3,
    title: "Kubernetes for Production Systems",
    author: "Maria Santos",
    rating: 4.7,
    students: "5.2K",
    duration: "18h",
    tags: ["K8s", "DevOps"],
    status: "Expert Approved",
    level: "Advanced"
  },
  {
    id: 4,
    title: "Product Design Fundamentals",
    author: "Alex Rivera",
    rating: 4.8,
    students: "9.1K",
    duration: "22h",
    tags: ["UX", "Figma"],
    status: "Expert Approved",
    level: "Beginner"
  },
  {
    id: 5,
    title: "System Design Interviews Masterclass",
    author: "Dr. Tom Nguyen",
    rating: 4.9,
    students: "21K",
    duration: "16h",
    tags: ["Architecture", "Scale"],
    status: "Expert Approved",
    level: "Advanced"
  },
  {
    id: 6,
    title: "Rust Programming — Zero to Production",
    author: "Elena Volkov",
    rating: 4.6,
    students: "3.1K",
    duration: "35h",
    tags: ["Rust", "Systems"],
    status: "Pending Review",
    level: "Intermediate"
  }
];

const CATEGORIES = ["All", "Engineering", "Data Science", "Design", "DevOps", "Business", "AI/ML"];

const Marketplace = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="marketplace-container">
      
      <div className="marketplace-header">
        <h1 className="marketplace-title">Course Marketplace</h1>
        <p className="marketplace-subtitle">Browse 2,400+ AI-generated, expert-approved courses</p>
      </div>

      <div className="marketplace-toolbar">
        <div className="marketplace-search">
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Search any skill or topic..." />
        </div>
        
        <select className="toolbar-select">
          <option>All levels</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        
        <select className="toolbar-select">
          <option>Expert Approved</option>
          <option>Pending Review</option>
        </select>
        
        <button className="toolbar-btn">
          <Filter size={16} /> Filters
        </button>
      </div>

      <div className="category-nav">
        {CATEGORIES.map(cat => (
          <div 
            key={cat} 
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      <div className="trending-banner">
        <div>
          <div className="trending-badge">
            <Sparkles size={14} /> AI Trending
          </div>
          <h2 className="trending-title">LLM Engineering: Build Production AI Apps</h2>
          <p className="trending-subtitle">By Dr. Lena Park • Expert Reviewed • 18,400 students</p>
        </div>
        <button className="trending-btn">View Course</button>
      </div>

      <div className="marketplace-grid">
        {MOCK_COURSES.map(course => (
          <div key={course.id} className="course-card">
            <div className="card-image-area">
              <div className={`card-status-badge ${course.status === 'Pending Review' ? 'pending' : ''}`}>
                {course.status === 'Pending Review' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                {course.status}
              </div>
              <div className="card-tags">
                {course.tags.map(tag => (
                  <span key={tag} className="card-tag">{tag}</span>
                ))}
              </div>
            </div>
            <div className="card-content">
              <h3 className="card-title">{course.title}</h3>
              <p className="card-author">{course.author}</p>
              
              <div className="card-meta">
                <span className="meta-item"><Star className="star" size={14} fill="currentColor" /> {course.rating}</span>
                <span className="meta-item"><Users size={14} /> {course.students}</span>
                <span className="meta-item"><Clock size={14} /> {course.duration}</span>
              </div>
              
              <span className={`card-level ${course.level.toLowerCase()}`}>
                {course.level}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Marketplace;
