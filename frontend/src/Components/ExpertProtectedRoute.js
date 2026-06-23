import React, { useState } from 'react';

const ExpertProtectedRoute = ({ user, children }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (user && user.role === 'expert') {
    return children;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Invalid email or password');
      }

      const data = await res.json();
      if (data.user.role !== 'expert') {
        throw new Error('This account does not have expert validation permissions.');
      }

      localStorage.setItem('sf_token', data.access_token);
      localStorage.setItem('sf_user', JSON.stringify(data.user));
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expert-login-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '75vh',
      padding: '2rem',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="expert-login-card glass" style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Expert Access Required</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Please authenticate with expert credentials to access the validation hub.</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Expert Email</label>
            <input 
              type="email" 
              required
              placeholder="expert@skillforge.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#8b5cf6',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Expert'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpertProtectedRoute;

