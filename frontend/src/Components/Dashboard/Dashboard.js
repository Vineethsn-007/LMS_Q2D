import React, { useState } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import Marketplace from './Marketplace';
import MyLearning from './MyLearning';
import Certifications from './Certifications';
import './Dashboard.css';
import './Marketplace.css';
import './MyLearning.css';
import './Certifications.css';

const Dashboard = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState('dashboard');

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
            <button className="action-btn">
              <Settings size={20} />
            </button>
            <div className="user-avatar" style={{ width: '32px', height: '32px', cursor: 'pointer' }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Dashboard Content Area */}
        {activeView === 'dashboard' && <DashboardContent user={user} />}
        {activeView === 'marketplace' && <Marketplace />}
        {activeView === 'mylearning' && <MyLearning />}
        {activeView === 'certifications' && <Certifications />}
      </main>
    </div>
  );
};

export default Dashboard;
