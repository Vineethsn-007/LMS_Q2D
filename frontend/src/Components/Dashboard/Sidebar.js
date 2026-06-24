import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  Bot, 
  Award, 
  FileEdit, 
  Wand2, 
  Shield,
  LogOut
} from 'lucide-react';
import logoImg from '../../logo.png';
import './Dashboard.css';

const Sidebar = ({ user, onLogout, activeView, onViewChange }) => {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-logo">
        <img src={logoImg} alt="SkillForge Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
        SkillForge
      </div>

      {user?.role !== 'reviewer' && user?.role !== 'admin' && user?.role !== 'expert' && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Learn</div>
          <nav className="sidebar-nav">
            <div 
              className={`sidebar-link ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onViewChange('dashboard')}
            >
              <div className="sidebar-link-content">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>
            </div>
            <div 
              className={`sidebar-link ${activeView === 'marketplace' ? 'active' : ''}`}
              onClick={() => onViewChange('marketplace')}
            >
              <div className="sidebar-link-content">
                <ShoppingBag size={18} />
                <span>Marketplace</span>
              </div>
            </div>
            <div 
              className={`sidebar-link ${activeView === 'mylearning' ? 'active' : ''}`}
              onClick={() => onViewChange('mylearning')}
            >
              <div className="sidebar-link-content">
                <BookOpen size={18} />
                <span>My Learning</span>
              </div>
            </div>
            <div className="sidebar-link">
              <div className="sidebar-link-content">
                <Bot size={18} />
                <span>AI Assistant</span>
              </div>
            </div>
            <div 
              className={`sidebar-link ${activeView === 'certifications' ? 'active' : ''}`}
              onClick={() => onViewChange('certifications')}
            >
              <div className="sidebar-link-content">
                <Award size={18} />
                <span>Certifications</span>
              </div>
            </div>
          </nav>
        </div>
      )}

      {user?.role !== 'reviewer' && user?.role !== 'admin' && user?.role !== 'expert' && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Create</div>
          <nav className="sidebar-nav">
            <div 
              className={`sidebar-link ${activeView === 'community-voting' ? 'active' : ''}`}
              onClick={() => onViewChange('community-voting')}
            >
              <div className="sidebar-link-content">
                <FileEdit size={18} />
                <span>Community feed</span>
              </div>
              <span className="sidebar-badge">12</span>
            </div>
            <div className="sidebar-link">
              <div className="sidebar-link-content">
                <Wand2 size={18} />
                <span>AI Generator</span>
              </div>
            </div>
          </nav>
        </div>
      )}

      {(user?.role === 'reviewer' || user?.role === 'admin') && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Review Admin</div>
          <nav className="sidebar-nav">
            <div 
              className={`sidebar-link ${activeView === 'review-center' ? 'active' : ''}`}
              onClick={() => onViewChange('review-center')}
            >
              <div className="sidebar-link-content">
                <FileEdit size={18} />
                <span>Review Center</span>
              </div>
            </div>
            {user?.role === 'admin' && (
              <div 
                className={`sidebar-link ${activeView === 'admin-panel' ? 'active' : ''}`}
                onClick={() => onViewChange('admin-panel')}
              >
                <div className="sidebar-link-content">
                  <Shield size={18} />
                  <span>Admin Panel</span>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}

      {(user?.role === 'expert' || user?.role === 'admin') && (
        <div className="sidebar-section">
          <div className="sidebar-section-title">Expert Console</div>
          <nav className="sidebar-nav">
            <div 
              className={`sidebar-link ${activeView === 'expert-panel' ? 'active' : ''}`}
              onClick={() => onViewChange('expert-panel')}
            >
              <div className="sidebar-link-content">
                <BookOpen size={18} />
                <span>Expert Panel</span>
              </div>
            </div>
          </nav>
        </div>
      )}



      <div className="sidebar-user" onClick={onLogout}>
        <div className="user-avatar">
          {user?.name?.charAt(0) || 'A'}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name || 'Alex Johnson'}</span>
          <span className="user-email">{user?.email || 'alex@company.com'}</span>
        </div>
        <LogOut size={16} color="#64748b" style={{ marginLeft: 'auto' }} />
      </div>
    </aside>
  );
};

export default Sidebar;
