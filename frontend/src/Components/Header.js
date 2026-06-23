import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import logoImg from '../logo.png';

export default function Header({ user, onLogout, onOpenAuth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header style={{
      ...styles.header,
      backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(250, 247, 242, 0.4)',
      borderBottomColor: scrolled ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.03)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div className="container" style={styles.container}>
        {/* Logo */}
        <div style={styles.logoContainer} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={styles.logoIcon}>
            <img src={logoImg} alt="SkillForge Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <span style={styles.logoText}>SkillForge</span>
        </div>

        {/* Desktop Nav Links */}
        <nav style={styles.desktopNav}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={styles.navLink}>Home</button>
          <button onClick={() => scrollToSection('courses')} style={styles.navLink}>Courses</button>
          <button onClick={() => scrollToSection('experts')} style={styles.navLink}>Experts</button>
        </nav>

        {/* Desktop Auth */}
        <div style={styles.desktopAuth}>
          {user ? (
            <div style={styles.userInfo}>
              <div style={styles.avatar}>
                <UserIcon size={14} color="#f8fafc" />
              </div>
              <span style={styles.userName}>{user.name}</span>
              <button onClick={onLogout} style={styles.logoutBtn} title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <button onClick={onOpenAuth} style={styles.loginBtn}>Log in</button>
              <button onClick={onOpenAuth} style={styles.getStartedBtn} className="btn-primary">
                Get started
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Icon */}
        <button onClick={() => setIsOpen(!isOpen)} style={styles.menuBtn}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div style={styles.mobileDrawer} className="glass">
          <nav style={styles.mobileNav}>
            <button onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={styles.mobileNavLink}>Home</button>
            <button onClick={() => scrollToSection('courses')} style={styles.mobileNavLink}>Courses</button>
            <button onClick={() => scrollToSection('experts')} style={styles.mobileNavLink}>Experts</button>
            <hr style={styles.divider} />
            {user ? (
              <div style={styles.mobileUserInfo}>
                <div style={styles.mobileUserRow}>
                  <div style={styles.avatar}>
                    <UserIcon size={14} color="#f8fafc" />
                  </div>
                  <span style={styles.mobileUserName}>{user.name}</span>
                </div>
                <button onClick={() => { onLogout(); setIsOpen(false); }} style={styles.mobileLogoutBtn}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            ) : (
              <div style={styles.mobileAuthActions}>
                <button onClick={() => { onOpenAuth(); setIsOpen(false); }} style={styles.mobileLoginBtn}>Log in</button>
                <button onClick={() => { onOpenAuth(); setIsOpen(false); }} style={styles.mobileGetStartedBtn} className="btn-primary">
                  Get started
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '72px',
    borderBottom: '1px solid transparent',
    zIndex: 100,
    transition: 'all 0.3s ease',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    cursor: 'pointer',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: "var(--font-heading)",
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  navLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.925rem',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color var(--transition-fast)',
  },
  // We handle hover style dynamically or simple styles.
  desktopAuth: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  loginBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.925rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'color var(--transition-fast)',
  },
  getStartedBtn: {
    padding: '0.55rem 1.25rem',
    fontSize: '0.875rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '9999px',
    padding: '0.35rem 0.5rem 0.35rem 0.75rem',
  },
  avatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#0f172a',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem',
    borderRadius: '50%',
    transition: 'color 0.2s',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: '#0f172a',
    cursor: 'pointer',
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'block',
    },
  },
  mobileDrawer: {
    position: 'absolute',
    top: '72px',
    left: 0,
    right: 0,
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  mobileNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  mobileNavLink: {
    background: 'none',
    border: 'none',
    textAlign: 'left',
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border-color)',
    margin: '0.5rem 0',
  },
  mobileAuthActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mobileLoginBtn: {
    background: 'none',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '0.65rem',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  mobileGetStartedBtn: {
    width: '100%',
    padding: '0.75rem',
  },
  mobileUserInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  mobileUserRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  mobileUserName: {
    fontWeight: '600',
    color: '#fff',
  },
  mobileLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '0.65rem',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

// Add responsive media query handlers in Javascript styling since standard css media query is simpler but this works.
// Let's add a small style injection to make sure our navigation is responsive.
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (max-width: 768px) {
      header nav, header .desktop-auth {
        display: none !important;
      }
      header button[style*="display: none"] {
        display: block !important;
      }
    }
    @keyframes slideDown {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes modalFadeIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
