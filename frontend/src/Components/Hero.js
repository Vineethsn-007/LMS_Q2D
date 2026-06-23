import React from 'react';
import { ArrowRight, Globe } from 'lucide-react';

export default function Hero({ stats, onStartFree, onBrowseCourses }) {
  // Safe extraction of stats with fallback values matching the mockup image
  const activeLearners = stats.find(s => s.key === 'active_learners')?.value || '50K+';
  const activeLearnersLabel = stats.find(s => s.key === 'active_learners')?.label || 'Active Learners';
  
  const expertCourses = stats.find(s => s.key === 'expert_courses')?.value || '2,400+';
  const expertCoursesLabel = stats.find(s => s.key === 'expert_courses')?.label || 'Expert-Approved Courses';
  
  const domainExperts = stats.find(s => s.key === 'domain_experts')?.value || '500+';
  const domainExpertsLabel = stats.find(s => s.key === 'domain_experts')?.label || 'Domain Experts';

  return (
    <section style={styles.heroSection}>
      <div className="container" style={styles.container}>
        {/* Sparkle Badge */}
        <div style={styles.badge} className="glass">
          <span style={styles.badgeSparkle}>✦</span>
          <span style={styles.badgeText}>AI-Generated · Expert-Validated · Community-Voted</span>
        </div>

        {/* Heading */}
        <h1 style={styles.heading}>
          Learn Skills That <br />
          <span className="text-gradient-cyan" style={styles.gradientText}>Actually Matter</span>
        </h1>

        {/* Subtitle */}
        <p style={styles.subtitle}>
          SkillForge combines AI-generated curricula with human expert validation and community voting 
          to deliver the most relevant, up-to-date courses for modern professionals.
        </p>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button onClick={onStartFree} style={styles.primaryBtn} className="btn-primary">
            Start Learning Free <ArrowRight size={18} />
          </button>
          <button onClick={onBrowseCourses} style={styles.secondaryBtn} className="btn-secondary">
            <Globe size={18} color="#94a3b8" /> Browse Courses
          </button>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{activeLearners}</span>
            <span style={styles.statLabel}>{activeLearnersLabel}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{expertCourses}</span>
            <span style={styles.statLabel}>{expertCoursesLabel}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{domainExperts}</span>
            <span style={styles.statLabel}>{domainExpertsLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  heroSection: {
    padding: '9rem 0 6rem 0',
    textAlign: 'center',
    position: 'relative',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 1rem',
    borderRadius: '9999px',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    marginBottom: '2.5rem',
    boxShadow: '0 0 15px -3px rgba(14, 165, 233, 0.15)',
  },
  badgeSparkle: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  badgeText: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#0284c7',
    letterSpacing: '0.02em',
  },
  heading: {
    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
    lineHeight: '1.15',
    color: '#0f172a',
    fontWeight: '800',
    marginBottom: '1.5rem',
    letterSpacing: '-0.03em',
  },
  gradientText: {
    display: 'inline-block',
  },
  subtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    color: 'var(--text-secondary)',
    maxWidth: '680px',
    lineHeight: '1.6',
    marginBottom: '3rem',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '5rem',
  },
  primaryBtn: {
    padding: '0.875rem 2rem',
    fontSize: '1rem',
  },
  secondaryBtn: {
    padding: '0.875rem 2rem',
    fontSize: '1rem',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6rem',
    width: '100%',
    maxWidth: '900px',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
    paddingTop: '3rem',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statNumber: {
    fontFamily: 'var(--font-heading)',
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (max-width: 640px) {
      .hero-stats-row {
        gap: 2rem !important;
        flex-direction: column;
      }
    }
  `;
  document.head.appendChild(style);
}
