import React from 'react';
import { Search, Star, Clock, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CoursesGrid({ 
  courses, 
  activeCategory, 
  setActiveCategory, 
  searchQuery, 
  setSearchQuery, 
  onEnrollCourse 
}) {
  const categories = [
    'All', 
    'AI & Machine Learning', 
    'Software Engineering', 
    'Data Science & Databases', 
    'Product & DevOps'
  ];

  return (
    <section id="courses" style={styles.section}>
      <div className="container">
        {/* Title Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Explore Curated Curricula</h2>
          <p style={styles.subtitle}>
            Empowered by AI. Audited by Industry Professionals. Validated by the community.
          </p>
        </div>

        {/* Filters and Search Bar Row */}
        <div style={styles.filterRow}>
          {/* Category Tabs */}
          <div style={styles.tabsContainer}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...styles.tabBtn,
                  backgroundColor: activeCategory === cat ? 'var(--color-accent-blue)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: activeCategory === cat ? 'var(--color-accent-sky)' : 'var(--border-color)',
                  color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input Box */}
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              className="form-input"
            />
          </div>
        </div>

        {/* Courses Cards Grid */}
        {courses.length > 0 ? (
          <div style={styles.grid}>
            {courses.map((course) => (
              <div 
                key={course.id} 
                style={styles.card} 
                className="glass"
              >
                {/* Image Cover */}
                <div style={styles.cardImageContainer}>
                  <img 
                    src={course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400'} 
                    alt={course.title} 
                    style={styles.cardImage} 
                  />
                  <span style={styles.categoryBadge}>{course.category}</span>
                </div>

                {/* Content Card Body */}
                <div style={styles.cardBody}>
                  {/* Validation Badges */}
                  <div style={styles.badgeRow}>
                    {course.is_ai_generated && (
                      <span style={{ ...styles.badge, backgroundColor: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                        <Sparkles size={12} /> AI-Generated
                      </span>
                    )}
                    {course.is_expert_validated && (
                      <span style={{ ...styles.badge, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                        <CheckCircle2 size={12} /> Expert-Approved
                      </span>
                    )}
                  </div>

                  <h3 style={styles.cardTitle}>{course.title}</h3>
                  <p style={styles.cardDesc}>{course.description}</p>
                  
                  {/* Meta Information Stats */}
                  <div style={styles.metaRow}>
                    <div style={styles.metaItem}>
                      <Star size={14} fill="#fbbf24" color="#fbbf24" />
                      <span style={styles.metaText}>{course.rating}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <Users size={14} color="var(--text-muted)" />
                      <span style={styles.metaText}>{(course.students_count / 1000).toFixed(1)}k</span>
                    </div>
                    <div style={styles.metaItem}>
                      <Clock size={14} color="var(--text-muted)" />
                      <span style={styles.metaText}>{course.hours}h</span>
                    </div>
                  </div>

                  {/* CTA Enroll Button */}
                  <button 
                    onClick={() => onEnrollCourse(course)}
                    style={styles.enrollBtn} 
                    className="btn-secondary"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No courses match your search or category filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: '5rem 0',
    backgroundColor: 'var(--bg-deep)',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '3.5rem',
  },
  title: {
    fontSize: '2.25rem',
    color: '#0f172a',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '3rem',
    flexWrap: 'wrap',
  },
  tabsContainer: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  tabBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '500',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: '280px',
    '@media (max-width: 640px)': {
      width: '100%',
    },
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    color: '#64748b',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    paddingLeft: '2.5rem',
    borderRadius: '9999px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '2rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxShadow: 'var(--shadow-md)',
  },
  cardImageContainer: {
    position: 'relative',
    height: '200px',
    width: '100%',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },
  categoryBadge: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#0f172a',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
  },
  cardBody: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  badgeRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '0.25rem',
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  cardTitle: {
    fontSize: '1.25rem',
    color: '#0f172a',
    marginBottom: '0.75rem',
    lineHeight: '1.35',
  },
  cardDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
    flexGrow: 1,
  },
  metaRow: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    paddingTop: '1rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  metaText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  enrollBtn: {
    width: '100%',
    padding: '0.65rem',
    fontSize: '0.9rem',
    borderRadius: '0.5rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 0',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '1.1rem',
  },
};

// Add hover effect animations via styled elements
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    div[class*="glass"]:hover {
      transform: translateY(-5px);
      border-color: var(--border-hover) !important;
      box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.15), 0 0 20px -5px rgba(37, 99, 235, 0.05) !important;
    }
    div[class*="glass"]:hover img {
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);
}
