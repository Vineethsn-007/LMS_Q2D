import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BookOpen, 
  Bot, 
  Award, 
  FileEdit, 
  Wand2, 

  LogOut
} from 'lucide-react';
import './Dashboard.css';

const Sidebar = ({ user, onLogout, activeView, onViewChange }) => {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">S</div>
        SkillForge
      </div>

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
          <div className="sidebar-link">
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
          <div className="sidebar-link">
            <div className="sidebar-link-content">
              <Award size={18} />
              <span>Certifications</span>
            </div>
          </div>
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Create</div>
        <nav className="sidebar-nav">
          <div className="sidebar-link">
            <div className="sidebar-link-content">
              <FileEdit size={18} />
              <span>Proposals & Voting</span>
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
