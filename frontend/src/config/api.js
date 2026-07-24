export const API_BASE = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'undefined')
  ? process.env.REACT_APP_API_URL
  : (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')
    ? 'https://skillforge-backend-uy0u.onrender.com'
    : 'http://localhost:8000');
