import React, { useState } from 'react';
import { PrivacyModal, TermsModal } from './LegalModals';
import { BRANDING } from '../config/branding';

export default function Footer({ setActivePage }) {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.container}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Brand Column */}
          <div style={styles.brandCol}>
            <div style={styles.logoRow}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#2563EB" />
                <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#60A5FA" />
              </svg>
              <span style={styles.logoText}>{BRANDING.HEADER_LOGO_TEXT}</span>
            </div>
            <p style={styles.brandDesc}>
              Institutional Learning Management & Proctored Examination System.
            </p>
          </div>

          {/* Product Links */}
          <div style={styles.linksCol}>
            <h4 style={styles.colTitle}>Navigation</h4>
            <ul style={styles.linkList}>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); if(setActivePage) setActivePage('home'); window.scrollTo(0,0); }} style={styles.link}>
                  Home
                </a>
              </li>
              <li>
                <a href="#benefits" onClick={(e) => { if(setActivePage) { e.preventDefault(); setActivePage('home'); setTimeout(()=>window.location.hash='#benefits', 100); } }} style={styles.link}>
                  Methodology
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Banner */}
        <div style={styles.bottomBanner}>
          <p style={styles.copyright}>
            {BRANDING.FOOTER_TEXT} | Powered by <a href="https://datavex.ai/" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>DataVex</a>
          </p>
          <div style={styles.bottomLinks}>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              style={{ ...styles.bottomLink, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setIsTermsOpen(true)}
              style={{ ...styles.bottomLink, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#0a0a0a',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '5rem 0 3rem 0',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4rem',
  },
  brandCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#ffffff',
  },
  brandDesc: {
    fontSize: '0.875rem',
    color: '#a1a1aa',
    lineHeight: '1.6',
    maxWidth: '300px',
  },
  linksCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  colTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  linkList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  link: {
    color: '#a1a1aa',
    textDecoration: 'none',
    fontSize: '0.875rem',
    transition: 'color var(--transition-fast)',
    cursor: 'pointer',
  },
  bottomBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  copyright: {
    fontSize: '0.8rem',
    color: '#71717a',
  },
  bottomLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  bottomLink: {
    fontSize: '0.8rem',
    color: '#71717a',
    textDecoration: 'none',
  },
};
