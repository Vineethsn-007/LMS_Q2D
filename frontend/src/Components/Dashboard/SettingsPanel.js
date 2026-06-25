import React, { useState, useEffect } from 'react';
import { User, Mail, Clock, Shield, Flame, Trophy, Eye, EyeOff } from 'lucide-react';
import './SettingsPanel.css';

export default function SettingsPanel({ user, onUserUpdate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [weeklyGoalHours, setWeeklyGoalHours] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isLearner = !user || !user.role || user.role === 'learner';

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setWeeklyGoalHours(user.weekly_goal_hours !== undefined ? user.weekly_goal_hours.toString() : '8');
      setPassword('');
      setError('');
      setSuccess(false);
    }
  }, [user]);

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

    let hours = parseFloat(weeklyGoalHours);
    if (isLearner) {
      if (isNaN(hours) || hours <= 0) {
        setError('Weekly study goal must be a positive number.');
        return;
      }
    } else {
      hours = user?.weekly_goal_hours || 8;
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
          weekly_goal_hours: hours,
          ...(password && !isLearner ? { password } : {})
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
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-panel-container">
      <div className="settings-panel-header">
        <h1 className="settings-panel-title">Profile & Settings</h1>
        <p className="settings-panel-subtitle">Manage your account information and customize your weekly study goals.</p>
      </div>

      {error && <div className="settings-alert settings-alert-error">{error}</div>}
      {success && <div className="settings-alert settings-alert-success">✓ Settings updated successfully!</div>}

      <div className="settings-grid">
        {/* Left Column: Form Card */}
        <div className="settings-card settings-form-card">
          <h2 className="settings-card-title">Account Details</h2>
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="settings-input-group">
              <label className="settings-label">
                <User size={16} /> Name
              </label>
              <input
                type="text"
                className="settings-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                disabled={loading}
              />
            </div>

            <div className="settings-input-group">
              <label className="settings-label">
                <Mail size={16} /> Email Address
              </label>
              <input
                type="email"
                className="settings-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                disabled={loading}
              />
            </div>

            {isLearner ? (
              <div className="settings-input-group">
                <label className="settings-label">
                  <Clock size={16} /> Weekly Study Goal (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  className="settings-input"
                  value={weeklyGoalHours}
                  onChange={(e) => setWeeklyGoalHours(e.target.value)}
                  placeholder="Weekly Goal Hours"
                  disabled={loading}
                />
                <span className="settings-helper-text">
                  Your target weekly hours will show up on your dashboard progress bar.
                </span>
              </div>
            ) : (
              <div className="settings-input-group">
                <label className="settings-label">
                  <Shield size={16} /> Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="settings-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    disabled={loading}
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="settings-helper-text">
                  Update your password.
                </span>
              </div>
            )}

            <button type="submit" className="settings-save-btn" disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Right Column: Profile Summary / Info card */}
        <div className="settings-card settings-summary-card">
          <h2 className="settings-card-title">Learning Stats Summary</h2>
          <div className="settings-avatar-section">
            <div className="settings-avatar-large">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="settings-avatar-info">
              <div className="settings-user-name">{user?.name}</div>
              <div className="settings-user-role">{user?.role?.toUpperCase()}</div>
            </div>
          </div>

          <div className="settings-stats-list">
            <div className="settings-stat-item">
              <div className="settings-stat-icon-wrap streak">
                <Flame size={20} />
              </div>
              <div className="settings-stat-details">
                <div className="settings-stat-value">{user?.streak || 0} Days</div>
                <div className="settings-stat-label">Current Streak</div>
              </div>
            </div>

            <div className="settings-stat-item">
              <div className="settings-stat-icon-wrap xp">
                <Trophy size={20} />
              </div>
              <div className="settings-stat-details">
                <div className="settings-stat-value">{user?.xp_points?.toLocaleString() || 0} XP</div>
                <div className="settings-stat-label">Total Points</div>
              </div>
            </div>

            <div className="settings-stat-item">
              <div className="settings-stat-icon-wrap shield">
                <Shield size={20} />
              </div>
              <div className="settings-stat-details">
                <div className="settings-stat-value">
                  {user?.role === 'admin' ? 'Super Admin' : user?.role === 'expert' ? 'Expert review' : user?.role === 'reviewer' ? 'Reviewer' : 'Standard Learner'}
                </div>
                <div className="settings-stat-label">Account Privilege</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
