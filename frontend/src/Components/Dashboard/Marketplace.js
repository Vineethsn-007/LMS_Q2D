import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle2, Clock, Sparkles, Star, Users, RefreshCw, Award } from 'lucide-react';
import CertificateModal from './CertificateModal';
import './Marketplace.css';

const Marketplace = ({ user, onStartCourse, onCheckout, onGoToCart }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All levels");
  const [selectedStatus, setSelectedStatus] = useState("All status");
  const [completedCourses, setCompletedCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [cartCourses, setCartCourses] = useState([]);
  const [expandedCourses, setExpandedCourses] = useState([]);
  const [paymentCourse, setPaymentCourse] = useState(null);
  const [certificateCourse, setCertificateCourse] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);



  useEffect(() => {
    const savedCompleted = JSON.parse(localStorage.getItem('sf_completed_courses') || '[]');
    setCompletedCourses(savedCompleted);
    const savedEnrolled = JSON.parse(localStorage.getItem('sf_enrolled_courses') || '[]');
    setEnrolledCourses(savedEnrolled);
    
    const updateCart = () => {
      const savedCart = JSON.parse(localStorage.getItem('sf_cart') || '[]');
      setCartCourses(savedCart);
    };
    updateCart();
    window.addEventListener('storage', updateCart);
    window.addEventListener('cart_updated', updateCart);
    return () => {
      window.removeEventListener('storage', updateCart);
      window.removeEventListener('cart_updated', updateCart);
    };
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };



  const handlePaymentSuccess = (course) => {
    const updatedEnrolled = [...enrolledCourses, course.id];
    setEnrolledCourses(updatedEnrolled);
    localStorage.setItem('sf_enrolled_courses', JSON.stringify(updatedEnrolled));
    
    setPaymentCourse(null);
    
    // Auto-start after payment
    if (onStartCourse) {
      onStartCourse(course);
    } else {
      showToast(`Enrolled and loading learning dashboard for "${course.title}"...`);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (activeCategory && activeCategory !== 'All') {
        queryParams.append('category', activeCategory);
      }
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const url = `${process.env.REACT_APP_API_URL}/api/courses?${queryParams.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Error fetching marketplace courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [activeCategory, searchQuery]);

  const filteredCourses = courses.filter(course => {
    // Determine level based on hours
    const level = course.hours > 35 ? "Advanced" : course.hours > 25 ? "Intermediate" : "Beginner";
    if (selectedLevel !== "All levels" && level !== selectedLevel) return false;

    // Determine status based on expert validation
    const status = course.is_expert_validated ? "Expert Approved" : "Pending Review";
    if (selectedStatus !== "All status" && status !== selectedStatus) return false;

    return true;
  });

  return (
    <div className="marketplace-container">

      <div className="marketplace-header">
        <h1 className="marketplace-title">Course Marketplace</h1>
        <p className="marketplace-subtitle">Browse {courses.length} AI-generated, expert-approved courses</p>
      </div>

      <div className="marketplace-toolbar">
        <div className="marketplace-search">
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search any skill or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="toolbar-select"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="All levels">All levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <select
          className="toolbar-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All status">All status</option>
          <option value="Expert Approved">Expert Approved</option>
          <option value="Pending Review">Pending Review</option>
        </select>

        <button className="toolbar-btn" onClick={fetchCourses}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>


      {/* Trending Banner (using the highest rated course as trending if available) */}
      {courses.length > 0 && (
        <div className="trending-banner">
          <div>
            <div className="trending-badge">
              <Sparkles size={14} /> AI Trending
            </div>
            <h2 className="trending-title">{courses[0].title}</h2>
            <p className="trending-subtitle">
              By SkillForge AI • {courses[0].is_expert_validated ? 'Expert Reviewed' : 'Pending Review'} • {courses[0].students_count >= 1000 ? `${(courses[0].students_count / 1000).toFixed(1)}k` : courses[0].students_count} students
            </p>
          </div>
          <button className="trending-btn" onClick={() => onStartCourse && onStartCourse(courses[0])}>View Course</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <RefreshCw className="spin" size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
          Loading courses...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          <h3>No courses found</h3>
          <p>Try resetting filters or adjusting search queries.</p>
        </div>
      ) : (
        <div className="marketplace-grid">
          {filteredCourses.map(course => {
            const level = course.hours > 35 ? "Advanced" : course.hours > 25 ? "Intermediate" : "Beginner";
            const status = course.is_expert_validated ? "Expert Approved" : "Pending Review";
            const author = course.is_ai_generated ? "SkillForge AI" : "Domain Expert";
            const students = course.students_count >= 1000 ? `${(course.students_count / 1000).toFixed(1)}k` : `${course.students_count}`;
            const duration = `${course.hours}h`;
            const tags = [course.category];

            return (
              <div key={course.id} className="course-card">
                <div className="card-image-area" style={{
                  backgroundImage: course.image_url ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${course.image_url.startsWith('http') ? course.image_url : process.env.REACT_APP_API_URL + course.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  <div className={`card-status-badge ${status === 'Pending Review' ? 'pending' : ''}`}>
                    {status === 'Pending Review' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                    {status}
                  </div>
                  <div className="card-tags">
                    {tags.map(tag => (
                      <span key={tag} className="card-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{course.title}</h3>
                  <p className="card-author">{author}</p>

                  <div className="card-meta">
                    <span className="meta-item">
                      <Star className="star" size={14} fill="currentColor" /> {course.rating}
                    </span>
                    <span className="meta-item">
                      <Users size={14} /> {students}
                    </span>
                    <span className="meta-item">
                      <Clock size={14} /> {duration}
                    </span>
                  </div>

                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span className={`card-level ${level.toLowerCase()}`} style={{ margin: 0 }}>
                      {level}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                      {!enrolledCourses.includes(course.id) ? (
                        <>
                          {!expandedCourses.includes(course.id) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCourses(prev => [...prev, course.id]);
                              }}
                              style={{ 
                                padding: '0.45rem 0.75rem', 
                                fontSize: '0.775rem', 
                                borderRadius: '9999px', 
                                cursor: 'pointer',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#334155'
                              }}
                            >
                              Get Course
                            </button>
                          ) : (
                            <>
                              {cartCourses.some(c => c.id === course.id) ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onGoToCart) onGoToCart();
                                  }}
                                  style={{ 
                                    padding: '0.45rem 0.75rem', 
                                    fontSize: '0.775rem', 
                                    borderRadius: '9999px', 
                                    cursor: 'pointer',
                                    backgroundColor: '#2563eb',
                                    border: '1px solid #1d4ed8',
                                    color: 'white'
                                  }}
                                >
                                  Go to Cart
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const currentCart = JSON.parse(localStorage.getItem('sf_cart') || '[]');
                                    currentCart.push(course);
                                    localStorage.setItem('sf_cart', JSON.stringify(currentCart));
                                    window.dispatchEvent(new Event('cart_updated'));
                                    showToast(`"${course.title}" successfully added on cart!`);
                                  }}
                                  style={{ 
                                    padding: '0.45rem 0.75rem', 
                                    fontSize: '0.775rem', 
                                    borderRadius: '9999px', 
                                    cursor: 'pointer',
                                    backgroundColor: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    color: '#334155'
                                  }}
                                >
                                  Add to Cart
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onCheckout) {
                                    onCheckout(course);
                                  } else {
                                    setPaymentCourse(course);
                                  }
                                }}
                                style={{ 
                                  padding: '0.45rem 0.75rem', 
                                  fontSize: '0.775rem', 
                                  borderRadius: '9999px', 
                                  cursor: 'pointer',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none'
                                }}
                              >
                                Enroll Now
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (completedCourses.includes(course.id)) {
                              setCertificateCourse(course);
                            } else if (onStartCourse) {
                              onStartCourse(course);
                            } else {
                              showToast(`Loading learning dashboard for "${course.title}"...`);
                            }
                          }}
                          className={completedCourses.includes(course.id) ? "btn-success" : (course.id <= 3 ? "btn-primary" : "btn-secondary")}
                          style={{ 
                            padding: '0.45rem 0.75rem', 
                            fontSize: '0.775rem', 
                            borderRadius: '9999px', 
                            cursor: 'pointer',
                            backgroundColor: completedCourses.includes(course.id) ? '#22c55e' : undefined,
                            color: completedCourses.includes(course.id) ? '#fff' : undefined,
                            border: completedCourses.includes(course.id) ? 'none' : undefined,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {completedCourses.includes(course.id) ? (
                            <>
                              <Award size={14} /> Get Certificate
                            </>
                          ) : (course.id <= 3 ? "Continue Learning" : "Start Learning")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideUpFade 0.3s ease-out'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{toastMessage}</span>
        </div>
      )}

      {certificateCourse && (
        <CertificateModal 
          user={user}
          course={certificateCourse}
          onClose={() => setCertificateCourse(null)}
          onShowToast={showToast}
        />
      )}
    </div>
  );
};

export default Marketplace;
