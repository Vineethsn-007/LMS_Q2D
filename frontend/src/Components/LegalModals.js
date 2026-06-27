import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

export function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <Shield size={22} color="#2563eb" />
            <h2 style={styles.title}>Privacy Policy</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div style={styles.content}>
          <p style={styles.intro}>Last updated: June 24, 2026</p>
          <p style={styles.paragraph}>
            At SkillForge, we value your privacy and are committed to safeguarding the personal information you share with us. This policy describes how we collect, use, and store your data when you use the SkillForge LMS.
          </p>

          <h3 style={styles.sectionTitle}>1. Information We Collect</h3>
          <p style={styles.paragraph}>
            We collect information that you directly provide to us, including your Name, Email address, account password, and learning metrics such as weekly study goals, course completion progress, XP points, and learning streaks.
          </p>

          <h3 style={styles.sectionTitle}>2. How We Use Your Information</h3>
          <p style={styles.paragraph}>
            Your information is used to personalize your learning path, track weekly progress against your targets, display leaderboards, authenticate Google sign-ins, and allow experts and reviewers to manage course curricula safely.
          </p>

          <h3 style={styles.sectionTitle}>3. Data Protection & Sharing</h3>
          <p style={styles.paragraph}>
            We implement state-of-the-art security measures to encrypt passwords and personal data. We do not sell your learning profile or personal identifiers to third parties. Data is shared only with certified instructors validating your courses.
          </p>

          <h3 style={styles.sectionTitle}>4. Your Rights</h3>
          <p style={styles.paragraph}>
            You have the right to view, modify, or delete your account information at any time via your dashboard settings panel. You can also contact support to request a full extract of your learning profile history.
          </p>
        </div>
        
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.okBtn}>Close & Accept</button>
        </div>
      </div>
    </div>
  );
}

export function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <FileText size={22} color="#2563eb" />
            <h2 style={styles.title}>Terms of Service</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div style={styles.content}>
          <p style={styles.intro}>Last updated: June 24, 2026</p>
          <p style={styles.paragraph}>
            Welcome to SkillForge. By accessing our platform, catalog, community feeds, or validator panels, you agree to be bound by these Terms of Service.
          </p>

          <h3 style={styles.sectionTitle}>1. Account Responsibility</h3>
          <p style={styles.paragraph}>
            You must provide accurate and complete information when registering an account. You are responsible for safeguarding your credentials, including third-party Google authentication tokens, and for all activities under your account.
          </p>

          <h3 style={styles.sectionTitle}>2. Code of Conduct</h3>
          <p style={styles.paragraph}>
            SkillForge is built on peer and expert validation. You agree not to post malicious content, run unauthorized scripts to manipulate study hours or XP metrics, or abuse permission-based administrative review features.
          </p>

          <h3 style={styles.sectionTitle}>3. Intellectual Property</h3>
          <p style={styles.paragraph}>
            All course materials, expert videos, PDFs, and text outlines served on the platform are protected by copyright. They are licensed to you solely for personal learning and cannot be distributed or re-sold.
          </p>

          <h3 style={styles.sectionTitle}>4. Account Termination</h3>
          <p style={styles.paragraph}>
            We reserve the right to suspend or terminate accounts that violate these terms, including attempting to bypass role guards (e.g. expert validation gates) or posting fraudulent course proposals.
          </p>
        </div>
        
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.okBtn}>Close & Accept</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 10, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '1.5rem',
  },
  modal: {
    width: '100%',
    maxWidth: '650px',
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #e2e8f0',
    maxHeight: '85vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #f1f5f9',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  title: {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  content: {
    padding: '2rem',
    overflowY: 'auto',
    color: '#334155',
    lineHeight: '1.6',
    fontSize: '0.92rem',
  },
  intro: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: '#0f172a',
    marginTop: '1.5rem',
    marginBottom: '0.5rem',
  },
  paragraph: {
    margin: '0 0 1rem 0',
  },
  footer: {
    padding: '1.25rem 2rem',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  okBtn: {
    padding: '0.65rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }
};
