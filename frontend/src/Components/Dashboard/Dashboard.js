import React, { useState, useEffect } from 'react';
import { Bell, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';
import MyLearning from './MyLearning';
import Certifications from './Certifications';
import ReviewCenter from './ReviewCenter';
import ReviewerProtectedRoute from '../ReviewerProtectedRoute';
import AdminProtectedRoute from '../AdminProtectedRoute';
import AdminPanel from './AdminPanel';
import SubAdminProtectedRoute from '../SubAdminProtectedRoute';
import SubAdminConsole from './SubAdminConsole';
import ExpertProtectedRoute from '../ExpertProtectedRoute';
import ExpertPanel from './ExpertPanel';
import LearnerPerformance from './LearnerPerformance';
import TopicAssessment from './TopicAssessment';
import SettingsPanel from './SettingsPanel';
import useDynamicGreeting from '../../utils/useDynamicGreeting';
import RegisteredSubjectsDashboard from './RegisteredSubjectsDashboard';
import SlotBooking from './SlotBooking';
import MockResults from './MockResults';
import LiveClasses from './LiveClasses';
import LiveClassConfig from './LiveClassConfig';
import SupportCenter from './SupportCenter';
import AnnouncementBar from './AnnouncementBar';
import ForcePasswordChange from './ForcePasswordChange';
import LeaderboardView from './LeaderboardView';
import POCDashboard from './POCDashboard';
import './Dashboard.css';
import './MyLearning.css';
import './Certifications.css';
import './ExpertPanel.css';

const Dashboard = ({ user, onLogout, onUserUpdate }) => {
  const [activeView, setActiveView] = useState(
    user?.role === 'admin'
      ? 'admin-panel'
      : user?.role === 'sub_admin'
        ? 'subadmin-console'
        : user?.role === 'expert'
        ? 'expert-panel'
        : user?.role === 'reviewer'
          ? 'review-center'
          : 'dashboard'
  );
  const [activeCourse, setActiveCourse] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem('sf_welcome_shown'));
  const [activeSubject, setActiveSubject] = useState(null);
  const greeting = useDynamicGreeting();

  useEffect(() => {
    if (showWelcome) {
      sessionStorage.setItem('sf_welcome_shown', 'true');
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  useEffect(() => {
    const updateNotifications = () => {
      const issues = JSON.parse(localStorage.getItem('sf_certificate_issues') || '[]');
      const userEmail = user?.email || 'learner@example.com';
      const unnotifiedIssues = issues.filter(i => i.original_email === userEmail && i.status === 'resolved' && i.notified === false);
      setNotifications(unnotifiedIssues.map(issue => ({
        id: issue.id,
        text: `Your certificate issue for "${issue.course_name}" has been resolved!`
      })));
    };
    updateNotifications();
    window.addEventListener('storage', updateNotifications);
    window.addEventListener('certificate_issue_updated', updateNotifications);
    return () => {
      window.removeEventListener('storage', updateNotifications);
      window.removeEventListener('certificate_issue_updated', updateNotifications);
    };
  }, [user]);

  const handleNotificationClick = (id) => {
    const issues = JSON.parse(localStorage.getItem('sf_certificate_issues') || '[]');
    const updatedIssues = issues.map(i => i.id === id ? { ...i, notified: true } : i);
    localStorage.setItem('sf_certificate_issues', JSON.stringify(updatedIssues));
    window.dispatchEvent(new Event('certificate_issue_updated'));
  };

  const handleStartCourse = (course) => {
    setActiveCourse(course);
    setActiveView('mylearning');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-600">
      {/* Force password change screen */}
      {user?.must_change_password && (
        <ForcePasswordChange
          user={user}
          onSuccess={() => {
            if (onUserUpdate) {
              const token = localStorage.getItem('sf_token');
              fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
              })
                .then(r => r.ok ? r.json() : null)
                .then(updatedUser => { if (updatedUser) onUserUpdate(updatedUser); })
                .catch(() => {});
            }
          }}
        />
      )}
      <Sidebar
        user={user}
        onLogout={onLogout}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Announcement Bar */}
        {user?.role !== 'admin' && user?.role !== 'sub_admin' && (
          <AnnouncementBar user={user} />
        )}
        {/* Dashboard Header */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-navy-900 capitalize">
              {activeView.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user?.role !== 'admin' && (
              <>
                <button 
                  onClick={() => setActiveView('certifications')}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/80 text-amber-800 font-bold rounded-full hover:bg-amber-50 transition-all text-xs flex items-center gap-1.5 shadow-sm"
                  title="View Level & Badge Progression"
                >
                  🏅 Progression Center
                </button>
                <div className="relative">
                  <button className="relative p-2 text-slate-400 hover:text-navy transition-colors rounded-full hover:bg-slate-100" onClick={() => setShowNotifications(!showNotifications)}>
                    <Bell size={20} />
                    {notifications.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-coral text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">{notifications.length}</span>}
                  </button>
                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 font-semibold text-navy-900 text-sm">Notifications</div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 text-sm">No new notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="p-4 border-b border-slate-50 text-sm cursor-pointer flex gap-3 items-start hover:bg-slate-50 transition-colors" onClick={() => handleNotificationClick(n.id)}>
                              <div className="w-2 h-2 rounded-full bg-navy mt-1 shrink-0"></div>
                              <div className="leading-relaxed text-slate-700">{n.text}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            <div
              className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-bold cursor-pointer hover:shadow-md transition-shadow ml-2"
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
          ) : user?.role === 'sub_admin' ? (
            <SubAdminProtectedRoute user={user}>
              <SubAdminConsole user={user} />
            </SubAdminProtectedRoute>
          ) : user?.role === 'expert' ? (
            <ExpertProtectedRoute user={user}>
              <ExpertPanel user={user} />
            </ExpertProtectedRoute>
          ) : (
            <DashboardContent user={user} onStartCourse={handleStartCourse} />
          )
        )}
        {activeView === 'mylearning' && <MyLearning course={activeCourse} onBack={() => setActiveView('dashboard')} />}
        {activeView === 'certifications' && <Certifications user={user} />}
        {(activeView === 'test' || activeView === 'topic-assessment' || activeView === 'assessment') && <TopicAssessment user={user} />}
        {/* My Program Views */}
        {activeView === 'program' && (
          <RegisteredSubjectsDashboard
            user={user}
            onBookSlot={subject => { setActiveSubject(subject); setActiveView('slot-booking'); }}
            onViewResults={subject => { setActiveSubject(subject); setActiveView('mock-results'); }}
          />
        )}
        {activeView === 'slot-booking' && (
          <SlotBooking
            subject={activeSubject}
            onBack={() => setActiveView('program')}
          />
        )}
        {activeView === 'mock-results' && (
          <MockResults
            subject={activeSubject}
            onBack={() => setActiveView('program')}
          />
        )}
        {activeView === 'live-classes' && <LiveClasses user={user} />}
        {activeView === 'support' && <SupportCenter user={user} />}
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
        {activeView === 'subadmin-console' && (
          <SubAdminProtectedRoute user={user}>
            <SubAdminConsole user={user} />
          </SubAdminProtectedRoute>
        )}
        {activeView === 'poc-dashboard' && (
          <SubAdminProtectedRoute user={user} requiredPrivilege="verify_assessments">
            <POCDashboard user={user} />
          </SubAdminProtectedRoute>
        )}
        {activeView === 'expert-panel' && (
          <ExpertProtectedRoute user={user}>
            <ExpertPanel user={user} />
          </ExpertProtectedRoute>
        )}
        {(activeView === 'expert-learners' || activeView === 'learner-performance') && (
          <ExpertProtectedRoute user={user}>
            <LearnerPerformance user={user} />
          </ExpertProtectedRoute>
        )}
        {activeView === 'live-class-config' && (
          <LiveClassConfig user={user} />
        )}
        {activeView === 'settings' && (
          <SettingsPanel user={user} onUserUpdate={onUserUpdate} />
        )}
        {activeView === 'leaderboard' && (
          <LeaderboardView user={user} />
        )}
      </main>

      {showWelcome && (
        <div className="fixed inset-0 flex items-center justify-center z-[1100] bg-navy-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">{greeting.text}, {user?.name || user?.username}! {greeting.emoji}</h2>
            <p className="text-slate-500 text-sm">Ready to learn something new today?</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
