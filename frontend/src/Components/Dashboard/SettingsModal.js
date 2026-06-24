import React, { useState, useEffect } from 'react';
import { X, User, Mail, Clock } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose, user, onUserUpdate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [weeklyGoalHours, setWeeklyGoalHours] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setEmail(user.email || '');
      setWeeklyGoalHours(user.weekly_goal_hours !== undefined ? user.weekly_goal_hours.toString() : '8');
      setError('');
      setSuccess(false);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const hours = parseFloat(weeklyGoalHours);
    if (isNaN(hours) || hours <= 0) {
      setError('Weekly study goal must be a positive number.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('sf_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: trimmedName,
          email: email.trim(),
          weekly_goal_hours: hours
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update profile settings.');
      }

      setSuccess(true);
      if (onUserUpdate) {
        onUserUpdate(data);
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal-card">
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">Profile & Settings</h2>
          <button onClick={onClose} className="settings-modal-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="settings-modal-subtitle">Update your profile details and adjust your weekly learning goals.</p>

        {error && <div className="settings-modal-error">{error}</div>}
        {success && <div className="settings-modal-success">✓ Profile settings updated successfully!</div>}

        <form onSubmit={handleSubmit} className="settings-modal-form">
          <div className="settings-input-group">
            <label className="settings-label">
              <User size={16} className="settings-input-icon" />
              Full Name
            </label>
            <input
              type="text"
              className="settings-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              disabled={loading || success}
            />
          </div>

          <div className="settings-input-group">
            <label className="settings-label">
              <Mail size={16} className="settings-input-icon" />
              Email Address
            </label>
            <input
              type="email"
              className="settings-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              disabled={loading || success}
            />
          </div>

          <div className="settings-input-group">
            <label className="settings-label">
              <Clock size={16} className="settings-input-icon" />
              Weekly Study Goal (Hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              className="settings-input"
              value={weeklyGoalHours}
              onChange={(e) => setWeeklyGoalHours(e.target.value)}
              placeholder="e.g. 8"
              disabled={loading || success}
            />
            <span className="settings-helper-text">
              We'll track your progress against this goal on your dashboard.
            </span>
          </div>

          <div className="settings-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="settings-cancel-btn"
              disabled={loading || success}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="settings-submit-btn"
              disabled={loading || success}
            >
              {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
