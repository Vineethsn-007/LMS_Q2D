import React, { useState, useEffect, useCallback } from 'react';
import { Star, ThumbsUp, MessageSquare, Filter, Search, Send, CheckCircle, X, ChevronDown } from 'lucide-react';

const API = process.env.REACT_APP_API_URL;

// ─── Star Rating Component ───────────────────────────────────────────────────
function StarRating({ value, onChange, size = 24, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: readOnly ? 'default' : 'pointer',
            padding: '2px',
            transition: 'transform 0.15s ease',
            transform: !readOnly && hovered >= star ? 'scale(1.2)' : 'scale(1)',
          }}
          aria-label={`${star} star`}
        >
          <Star
            size={size}
            fill={display >= star ? '#f59e0b' : 'none'}
            color={display >= star ? '#f59e0b' : '#cbd5e1'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Rating Bar ──────────────────────────────────────────────────────────────
function RatingBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
      <span style={{ color: 'var(--text-muted)', minWidth: '14px', textAlign: 'right' }}>{label}</span>
      <Star size={12} fill="#f59e0b" color="#f59e0b" />
      <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          borderRadius: '999px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ color: 'var(--text-muted)', minWidth: '24px' }}>{count}</span>
    </div>
  );
}

// ─── Feedback Card ───────────────────────────────────────────────────────────
function FeedbackCard({ feedback, onHelpful }) {
  const [markedHelpful, setMarkedHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(feedback.helpful_count);
  const [loading, setLoading] = useState(false);

  const handleHelpful = async () => {
    if (markedHelpful || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/feedback/${feedback.id}/helpful`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setHelpfulCount(data.helpful_count);
        setMarkedHelpful(true);
        onHelpful && onHelpful(feedback.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const initials = feedback.user_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarColor = `hsl(${(feedback.user_name.charCodeAt(0) * 31) % 360}, 55%, 50%)`;

  const dateStr = new Date(feedback.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div style={cardStyles.wrapper} className="feedback-card">
      <div style={cardStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ ...cardStyles.avatar, background: avatarColor }}>
            {initials}
          </div>
          <div>
            <div style={cardStyles.userName}>{feedback.user_name}</div>
            <div style={cardStyles.date}>{dateStr}</div>
          </div>
        </div>
        <StarRating value={feedback.rating} readOnly size={16} />
      </div>

      {feedback.title && (
        <div style={cardStyles.title}>{feedback.title}</div>
      )}
      <p style={cardStyles.comment}>{feedback.comment}</p>

      <div style={cardStyles.footer}>
        <span style={cardStyles.courseBadge}>{feedback.course_title || `Course #${feedback.course_id}`}</span>
        <button
          onClick={handleHelpful}
          disabled={markedHelpful || loading}
          style={{
            ...cardStyles.helpfulBtn,
            ...(markedHelpful ? cardStyles.helpfulBtnActive : {}),
          }}
          id={`helpful-btn-${feedback.id}`}
        >
          <ThumbsUp size={13} />
          {markedHelpful ? 'Helpful!' : 'Helpful'} · {helpfulCount}
        </button>
      </div>
    </div>
  );
}

const cardStyles = {
  wrapper: {
    background: 'rgba(255,255,255,0.78)',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: '16px',
    padding: '20px 24px',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    cursor: 'default',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  userName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  date: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontWeight: '700',
    fontSize: '1rem',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  comment: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.65',
    marginBottom: '14px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  courseBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    background: 'rgba(37,99,235,0.08)',
    color: 'var(--color-accent-blue)',
    fontSize: '0.72rem',
    fontWeight: '600',
    border: '1px solid rgba(37,99,235,0.15)',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  helpfulBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(0,0,0,0.1)',
    background: '#fff',
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  helpfulBtnActive: {
    background: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.3)',
    color: '#16a34a',
  },
};

// ─── Write Feedback Modal ────────────────────────────────────────────────────
function WriteFeedbackModal({ courses, user, onClose, onSubmit }) {
  const [courseId, setCourseId] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!courseId) { setError('Please select a course.'); return; }
    if (!rating) { setError('Please give a star rating.'); return; }
    if (comment.trim().length < 10) { setError('Comment must be at least 10 characters.'); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('sf_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ course_id: parseInt(courseId), rating, title: title.trim() || null, comment: comment.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Submission failed.');
      }
      const data = await res.json();
      onSubmit(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyles.modal} id="write-feedback-modal">
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Share Your Experience</h2>
            <p style={modalStyles.subtitle}>Help other learners by reviewing a course</p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn} aria-label="Close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Course Selector */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Course *</label>
            <div style={{ position: 'relative' }}>
              <select
                id="feedback-course-select"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                style={modalStyles.select}
                required
              >
                <option value="">— Select a course —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Star Rating */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Rating *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StarRating value={rating} onChange={setRating} size={32} />
              {rating > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Review Title <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(optional)</span></label>
            <input
              id="feedback-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Incredible deep-dive into the topic"
              maxLength={120}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Comment */}
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Your Review *</label>
            <textarea
              id="feedback-comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what you liked or didn't like about this course. Your feedback helps other learners make better decisions."
              rows={5}
              className="form-input"
              style={{ width: '100%', resize: 'vertical', lineHeight: '1.6' }}
              required
            />
            <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {comment.length} / 1000
            </div>
          </div>

          {error && (
            <div style={modalStyles.error}>{error}</div>
          )}

          <button
            type="submit"
            id="submit-feedback-btn"
            disabled={submitting}
            className="btn-primary"
            style={{ padding: '0.85rem 2rem', fontSize: '0.95rem', borderRadius: '12px', alignSelf: 'flex-end' }}
          >
            {submitting ? 'Submitting…' : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '32px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    animation: 'slideUpFade 0.3s cubic-bezier(0.16,1,0.3,1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    gap: '12px',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  closeBtn: {
    background: 'rgba(0,0,0,0.05)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  select: {
    width: '100%',
    padding: '0.75rem 2.2rem 0.75rem 1rem',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    background: '#fff',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  error: {
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(239,68,68,0.07)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#dc2626',
    fontSize: '0.85rem',
  },
};

// ─── Main FeedbackPage ───────────────────────────────────────────────────────
export default function FeedbackPage({ user, onOpenAuth, insideDashboard = false }) {
  const [courses, setCourses] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch courses
  useEffect(() => {
    fetch(`${API}/api/courses`)
      .then((r) => r.json())
      .then(setCourses)
      .catch(console.error);
  }, []);

  // Fetch feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourseId !== 'all') params.append('course_id', selectedCourseId);
      const res = await fetch(`${API}/api/feedback?${params}`);
      if (res.ok) {
        const data = await res.json();
        // Enrich with course title
        setFeedbackList(data.map((fb) => ({
          ...fb,
          course_title: courses.find((c) => c.id === fb.course_id)?.title || `Course #${fb.course_id}`,
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, courses]);

  useEffect(() => {
    if (courses.length > 0 || selectedCourseId === 'all') fetchFeedback();
  }, [fetchFeedback]);

  const handleSubmitSuccess = (newFeedback) => {
    const enriched = {
      ...newFeedback,
      course_title: courses.find((c) => c.id === newFeedback.course_id)?.title || `Course #${newFeedback.course_id}`,
    };
    setFeedbackList((prev) => [enriched, ...prev]);
    setSuccessMsg('🎉 Your review has been published! Thank you for sharing.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Compute aggregated stats for the selected course filter
  const filteredFeedback = feedbackList
    .filter((fb) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        fb.comment.toLowerCase().includes(q) ||
        (fb.title || '').toLowerCase().includes(q) ||
        fb.user_name.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      if (sortBy === 'helpful') return b.helpful_count - a.helpful_count;
      return 0;
    });

  const totalReviews = feedbackList.length;
  const avgRating = totalReviews > 0
    ? (feedbackList.reduce((s, fb) => s + fb.rating, 0) / totalReviews).toFixed(1)
    : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    star: r,
    count: feedbackList.filter((fb) => fb.rating === r).length,
  }));

  return (
    <div style={insideDashboard ? { ...pageStyles.page, flex: 1, overflowY: 'auto', minHeight: 0 } : pageStyles.page}>
      {/* ── Hero Banner ─────────────────────────────────── */}
      <section style={{ ...pageStyles.heroBanner, padding: insideDashboard ? '40px 0 36px' : '100px 0 60px' }}>
        <div className="container" style={pageStyles.heroInner}>
          <div style={pageStyles.heroText}>
            <div style={pageStyles.heroBadge}>
              <MessageSquare size={14} />
              Community Reviews
            </div>
            <h1 style={pageStyles.heroTitle}>
              What Learners Are{' '}
              <span className="text-gradient-cyan">Saying</span>
            </h1>
            <p style={pageStyles.heroSubtitle}>
              Real reviews from real learners. Discover what makes each course special — or help the community by sharing your own experience.
            </p>
            <button
              id="write-review-hero-btn"
              className="btn-primary"
              onClick={() => {
                if (user) setShowModal(true);
                else if (onOpenAuth) onOpenAuth();
              }}
              style={{ padding: '0.85rem 2rem', fontSize: '0.95rem', borderRadius: '12px', marginTop: '8px' }}
            >
              <MessageSquare size={17} />
              {user ? 'Write a Review' : 'Sign in to Review'}
            </button>
          </div>

          {/* Stats Summary */}
          {totalReviews > 0 && (
            <div style={pageStyles.statsSummary} className="glass">
              <div style={pageStyles.bigRating}>
                <span style={pageStyles.bigRatingNum}>{avgRating}</span>
                <StarRating value={Math.round(avgRating)} readOnly size={22} />
                <span style={pageStyles.totalReviews}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                {ratingCounts.map(({ star, count }) => (
                  <RatingBar key={star} label={star} count={count} total={totalReviews} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Success Toast ───────────────────────────────── */}
      {successMsg && (
        <div style={pageStyles.toast}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {/* ── Filters Bar ─────────────────────────────────── */}
      <section style={insideDashboard
        ? { ...pageStyles.filtersSection, position: 'static', top: 'unset', background: 'rgba(250,247,242,0.6)' }
        : pageStyles.filtersSection
      }>
        <div className="container" style={pageStyles.filtersRow}>
          {/* Search */}
          <div style={pageStyles.searchWrap}>
            <Search size={16} style={pageStyles.searchIcon} />
            <input
              id="feedback-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews…"
              className="form-input"
              style={{ paddingLeft: '2.5rem', minWidth: '220px', flex: '1' }}
            />
          </div>

          {/* Course Filter */}
          <div style={{ position: 'relative' }}>
            <Filter size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              id="feedback-course-filter"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{ ...modalStyles.select, paddingLeft: '2.2rem', minWidth: '200px' }}
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title.length > 45 ? c.title.slice(0, 45) + '…' : c.title}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div style={{ position: 'relative' }}>
            <select
              id="feedback-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ ...modalStyles.select, minWidth: '160px' }}
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Reviews Grid ────────────────────────────────── */}
      <section style={pageStyles.reviewsSection}>
        <div className="container">
          {loading ? (
            <div style={pageStyles.emptyState}>
              <div style={pageStyles.spinner} />
              <p style={{ color: 'var(--text-muted)' }}>Loading reviews…</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div style={pageStyles.emptyState}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💬</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {feedbackList.length === 0 ? 'No reviews yet' : 'No reviews match your search'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '320px', textAlign: 'center' }}>
                {feedbackList.length === 0
                  ? 'Be the first to share your experience with a course!'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {feedbackList.length === 0 && (
                <button
                  className="btn-primary"
                  onClick={() => user ? setShowModal(true) : onOpenAuth()}
                  style={{ marginTop: '16px', padding: '0.7rem 1.5rem', fontSize: '0.875rem', borderRadius: '10px' }}
                >
                  Write the First Review
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={pageStyles.reviewsHeader}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Showing <strong>{filteredFeedback.length}</strong> review{filteredFeedback.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={pageStyles.grid}>
                {filteredFeedback.map((fb) => (
                  <FeedbackCard key={fb.id} feedback={fb} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Write Feedback Modal ─────────────────────────── */}
      {showModal && (
        <WriteFeedbackModal
          courses={courses}
          user={user}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitSuccess}
        />
      )}

      <style>{`
        .feedback-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.09);
          transform: translateY(-2px);
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUpFade {
          from { transform: translateY(24px); opacity:0; }
          to   { transform: translateY(0);    opacity:1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const pageStyles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-dark)',
  },
  heroBanner: {
    background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(79,70,229,0.04) 60%, rgba(250,247,242,0) 100%)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    padding: '100px 0 60px',
  },
  heroInner: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '48px',
    flexWrap: 'wrap',
  },
  heroText: { flex: 1, minWidth: '280px' },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 14px',
    borderRadius: '999px',
    background: 'rgba(37,99,235,0.08)',
    border: '1px solid rgba(37,99,235,0.15)',
    color: 'var(--color-accent-blue)',
    fontSize: '0.8rem',
    fontWeight: '600',
    marginBottom: '16px',
  },
  heroTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: '800',
    color: 'var(--text-primary)',
    lineHeight: '1.2',
    marginBottom: '16px',
    letterSpacing: '-0.03em',
  },
  heroSubtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.7',
    maxWidth: '480px',
  },
  statsSummary: {
    borderRadius: '20px',
    padding: '24px',
    minWidth: '280px',
    maxWidth: '340px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  bigRating: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  bigRatingNum: {
    fontSize: '3rem',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  totalReviews: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '999px',
    background: '#16a34a',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: '600',
    boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
    zIndex: 2000,
    animation: 'slideUpFade 0.3s ease',
  },
  filtersSection: {
    position: 'sticky',
    top: '72px',
    zIndex: 50,
    background: 'rgba(250,247,242,0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    padding: '14px 0',
  },
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '180px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  reviewsSection: {
    padding: '40px 0 80px',
  },
  reviewsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(37,99,235,0.15)',
    borderTopColor: 'var(--color-accent-blue)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },
};
