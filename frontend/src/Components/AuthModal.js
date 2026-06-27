import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      const apiResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: response.credential,
        }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.detail || 'Failed to authenticate with Google.');
      }

      onAuthSuccess(data.access_token, data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const initGoogle = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: "226786576550-028q9ec2gqq7q0cg62ahblpd2segfuto.apps.googleusercontent.com",
            callback: handleGoogleCredentialResponse,
          });
          setGoogleInitialized(true);
        } catch (e) {
          console.error("Error initializing Google Identity Services:", e);
        }
      }
    };

    if (typeof window !== 'undefined') {
      if (!document.getElementById('google-gsi-client')) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.head.appendChild(script);
      } else {
        initGoogle();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
      : { name, email, password };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL }${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong. Please try again.');
      }

      onAuthSuccess(data.access_token, data.user);
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <ShieldCheck size={24} color="#0ea5e9" />
            <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={styles.input}
                  className="form-input"
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{...styles.input, paddingRight: '40px'}}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={styles.submitBtn}
            className="btn-primary"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Get Started'}
          </button>

          <div style={styles.dividerContainer}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine} />
          </div>

          {googleInitialized ? (
            <div 
              id="google-signin-btn-container" 
              ref={(el) => {
                if (el && window.google && googleInitialized) {
                  try {
                    window.google.accounts.id.renderButton(
                      el,
                      { theme: 'outline', size: 'large', width: el.offsetWidth || 374 }
                    );
                  } catch (err) {
                    console.error("Error rendering Google button:", err);
                  }
                }
              }}
              style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '44px', marginTop: '0.25rem' }}
            />
          ) : (
            <button
              type="button"
              onClick={async () => {
                setError('');
                setLoading(true);
                try {
                  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      id_token: 'mock-google-token'
                    }),
                  });

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(data.detail || 'Failed mock Google login.');
                  }

                  onAuthSuccess(data.access_token, data.user);
                  onClose();
                } catch (err) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="btn-google"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          )}
        </form>

        {/* Footer Toggle */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={styles.toggleBtn}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
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
    zIndex: 1000,
    padding: '1.5rem',
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    borderRadius: '1rem',
    padding: '2rem',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    marginBottom: '1.25rem',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#475569',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    color: '#64748b',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    paddingLeft: '2.75rem',
  },
  submitBtn: {
    marginTop: '0.5rem',
    padding: '0.85rem',
    fontSize: '1rem',
    width: '100%',
  },
  dividerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0.25rem 0',
    gap: '0.75rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--border-color)',
  },
  dividerText: {
    fontSize: '0.825rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#475569',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#0ea5e9',
    fontWeight: '600',
    marginLeft: '0.35rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
