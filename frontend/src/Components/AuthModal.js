import React, { useState } from 'react';
import { X, Mail, Lock, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic client-side validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid credentials. Please try again.');
      }

      onAuthSuccess(data.access_token, data.user);
      onClose();
      setEmail('');
      setPassword('');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-navy-800 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-900 leading-tight">Welcome Back</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Sign in to your account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-start gap-2.5 shadow-sm">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-navy-900">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy shadow-inner transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-navy-900">Password</label>
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                onClick={() => alert('Please contact your institution or system administrator to reset your password.')}
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy shadow-inner transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy/20 cursor-pointer"
            />
            <label htmlFor="remember-me" className="text-xs font-medium text-slate-500 cursor-pointer select-none">
              Remember me on this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-3.5 bg-navy hover:bg-navy-800 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">Secure Login</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs font-medium text-slate-400 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
          Account creation is managed centrally by system administrators. Please contact your institution or coordinator if you require credentials.
        </div>

      </div>
    </div>
  );
}
