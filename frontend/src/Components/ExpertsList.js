import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';

export default function ExpertsList({ experts }) {
  // Fallback experts if backend is not seeded or returns empty
  const defaultExperts = [
    {
      id: 1,
      name: "Dr. Aris Thorne",
      role: "Ex-Google Brain Scientist",
      bio: "Specializes in deep neural networks and automated curriculum design. Helps SkillForge build adaptive learning paths.",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      courses_validated_count: 18
    },
    {
      id: 2,
      name: "Sarah Jenkins",
      role: "PostgreSQL Core Contributor",
      bio: "Database architect with 15+ years experience. Validates database curricula, query performance, and indexing paths.",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      courses_validated_count: 12
    },
    {
      id: 3,
      name: "Marcus Vance",
      role: "Principal Architect at CloudScale",
      bio: "DevOps pioneer and cloud native systems specialist. Validates site reliability and system design curricula.",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
      courses_validated_count: 15
    }
  ];

  const listToRender = experts && experts.length > 0 ? experts : defaultExperts;

  return (
    <section id="experts" style={styles.section}>
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge} className="glass">
            <Award size={14} color="#a855f7" />
            <span style={styles.badgeText}>Expert Validation Board</span>
          </div>
          <h2 style={styles.title}>Audited by Industry Experts</h2>
          <p style={styles.subtitle}>
            Meet the veterans who audit and structure our courses, ensuring every curriculum satisfies 
            real-world engineering standards.
          </p>
        </div>

        {/* Experts Grid */}
        <div style={styles.grid}>
          {listToRender.map((expert) => (
            <div key={expert.id} style={styles.card} className="glass">
              <div style={styles.profileRow}>
                {/* Avatar with Glow */}
                <div style={styles.avatarWrapper}>
                  <img 
                    src={expert.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'} 
                    alt={expert.name} 
                    style={styles.avatar}
                  />
                  <div style={styles.glowRing}></div>
                </div>
                
                {/* Details */}
                <div style={styles.details}>
                  <div style={styles.nameRow}>
                    <h3 style={styles.name}>{expert.name}</h3>
                    <span style={styles.verifiedTag} title="Verified Validator">
                      <ShieldCheck size={16} color="#10b981" fill="rgba(16,185,129,0.1)" />
                    </span>
                  </div>
                  <p style={styles.role}>{expert.role}</p>
                </div>
              </div>

              {/* Bio */}
              <p style={styles.bio}>"{expert.bio}"</p>

              {/* Audit Stats */}
              <div style={styles.statsRow}>
                <span style={styles.statsLabel}>Verified Approvals:</span>
                <span style={styles.statsCount}>{expert.courses_validated_count} Curricula</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: '6rem 0',
    backgroundColor: 'var(--bg-deep)',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.35rem 0.85rem',
    borderRadius: '9999px',
    border: '1px solid rgba(168, 85, 247, 0.25)',
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
    marginBottom: '1.25rem',
  },
  badgeText: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#7c3aed',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '2.25rem',
    color: '#0f172a',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '650px',
    margin: '0 auto',
    lineHeight: '1.5',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '2.5rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    padding: '2rem',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    boxShadow: 'var(--shadow-lg)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  profileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  avatarWrapper: {
    position: 'relative',
    width: '64px',
    height: '64px',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(0, 0, 0, 0.08)',
    zIndex: 2,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    top: '-3px',
    left: '-3px',
    right: '-3px',
    bottom: '-3px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-accent-sky), var(--color-accent-indigo))',
    opacity: 0.5,
    zIndex: 1,
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  name: {
    fontSize: '1.15rem',
    color: '#0f172a',
    fontWeight: '700',
  },
  verifiedTag: {
    display: 'flex',
    alignItems: 'center',
  },
  role: {
    fontSize: '0.875rem',
    color: 'var(--color-accent-sky)',
    fontWeight: '500',
  },
  bio: {
    fontSize: '0.925rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    fontStyle: 'italic',
    flexGrow: 1,
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    paddingTop: '1rem',
    fontSize: '0.85rem',
  },
  statsLabel: {
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  statsCount: {
    color: '#0f172a',
    fontWeight: '600',
  },
};
