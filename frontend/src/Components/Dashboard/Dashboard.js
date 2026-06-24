import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import Marketplace from './Marketplace';
import MyLearning from './MyLearning';
import Certifications from './Certifications';
import ReviewCenter from './ReviewCenter';
import CommunityVoting from './CommunityVoting';
import ReviewerProtectedRoute from '../ReviewerProtectedRoute';
import AdminProtectedRoute from '../AdminProtectedRoute';
import AdminPanel from './AdminPanel';
import ExpertProtectedRoute from '../ExpertProtectedRoute';
import ExpertPanel from './ExpertPanel';
import SettingsPanel from './SettingsPanel';
import './Dashboard.css';
import './Marketplace.css';
import './MyLearning.css';
import './Certifications.css';
import './ExpertPanel.css';

const Dashboard = ({ user, onLogout, onUserUpdate }) => {
  const [activeView, setActiveView] = useState(
    user?.role === 'admin' 
      ? 'admin-panel' 
      : user?.role === 'expert'
        ? 'expert-panel'
        : user?.role === 'reviewer' 
          ? 'review-center' 
          : 'dashboard'
  );

  return (
    <div className="dashboard-container">
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        activeView={activeView}
        onViewChange={setActiveView}
      />
      
      <main className="dashboard-main">
        {/* Dashboard Header */}
        <header className="dashboard-header">
          <div className="header-search">
            <Search size={18} color="#94a3b8" />
            <input type="text" placeholder="Search courses, skills, experts..." />
          </div>
          
          <div className="header-actions">
            <button className="action-btn">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>
            <div 
              className="user-avatar" 
              style={{ width: '32px', height: '32px', cursor: 'pointer' }}
              onClick={() => setActiveView('settings')}
            >
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Dashboard Content Area */}
        {activeView === 'dashboard' && (
          user?.role === 'admin' ? (
            <AdminProtectedRoute user={user}>
              <AdminPanel user={user} />
            </AdminProtectedRoute>
          ) : user?.role === 'expert' ? (
            <ExpertProtectedRoute user={user}>
              <ExpertPanel user={user} />
            </ExpertProtectedRoute>
          ) : (
            <DashboardContent user={user} />
          )
        )}
        {activeView === 'marketplace' && <Marketplace onViewChange={setActiveView} />}
        {activeView === 'mylearning' && <MyLearning />}
        {activeView === 'certifications' && <Certifications />}
        {activeView === 'community-voting' && <CommunityVoting />}
        {activeView === 'review-center' && (
          <ReviewerProtectedRoute user={user}>
            <ReviewCenter user={user} />
          </ReviewerProtectedRoute>
        )}
        {activeView === 'admin-panel' && (
          <AdminProtectedRoute user={user}>
            <AdminPanel user={user} />
          </AdminProtectedRoute>
        )}
        {activeView === 'expert-panel' && (
          <ExpertProtectedRoute user={user}>
            <ExpertPanel user={user} />
          </ExpertProtectedRoute>
        )}
        {activeView === 'settings' && (
          <SettingsPanel user={user} onUserUpdate={onUserUpdate} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
