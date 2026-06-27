import React, { useState, useEffect } from 'react';
import { Search, Bell, ShoppingCart } from 'lucide-react';
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
import Cart from './Cart';
import Checkout from './Checkout';
import FeedbackPage from '../FeedbackPage';
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
  const [activeCourse, setActiveCourse] = useState(null);
  const [cartCourses, setCartCourses] = useState([]);
  const [checkoutCourse, setCheckoutCourse] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const updateCart = () => {
      const savedCart = JSON.parse(localStorage.getItem('sf_cart') || '[]');
      setCartCourses(savedCart);
    };
    updateCart();
    window.addEventListener('storage', updateCart);
    window.addEventListener('cart_updated', updateCart);
    return () => {
      window.removeEventListener('storage', updateCart);
      window.removeEventListener('cart_updated', updateCart);
    };
  }, []);

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
          {user?.role !== 'admin' && (
            <div className="header-search">
              <Search size={18} color="#94a3b8" />
              <input type="text" placeholder="Search courses, skills, experts..." />
            </div>
          )}

          <div className="header-actions">
            {user?.role !== 'admin' && (
              <>
                <button className="action-btn" onClick={() => setActiveView('cart')}>
                  <ShoppingCart size={20} />
                  {cartCourses.length > 0 && <span className="notification-badge">{cartCourses.length}</span>}
                </button>
                <div style={{ position: 'relative' }}>
                  <button className="action-btn" onClick={() => setShowNotifications(!showNotifications)}>
                    <Bell size={20} />
                    {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
                  </button>
                  {showNotifications && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, width: '300px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 50, border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: '600', fontSize: '0.875rem' }}>Notifications</div>
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>No new notifications</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }} onClick={() => handleNotificationClick(n.id)}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', marginTop: '0.25rem', flexShrink: 0 }}></div>
                              <div style={{ lineHeight: '1.4' }}>{n.text}</div>
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
            <DashboardContent user={user} onStartCourse={handleStartCourse} />
          )
        )}
        {activeView === 'marketplace' && (
          <Marketplace 
            user={user}
            onStartCourse={handleStartCourse} 
            onCheckout={(course) => {
              setCheckoutCourse(course);
              setActiveView('checkout');
            }} 
            onGoToCart={() => setActiveView('cart')}
          />
        )}
        {activeView === 'mylearning' && <MyLearning course={activeCourse} onBack={() => setActiveView('dashboard')} />}
        {activeView === 'certifications' && <Certifications />}
        {activeView === 'community-voting' && <CommunityVoting />}
        {activeView === 'cart' && (
          <Cart 
            onBack={() => setActiveView('marketplace')} 
            onCheckout={(course) => {
              setCheckoutCourse(course);
              setActiveView('checkout');
            }} 
          />
        )}
        {activeView === 'checkout' && checkoutCourse && (
          <Checkout
            course={checkoutCourse}
            onBack={() => setActiveView('marketplace')}
            onSuccess={(course) => {
              // Note: Success enrollment handled inside Cart/Marketplace or here.
              // For a uniform approach, we can do enrollment here:
              if (course.id === 'cart_checkout') {
                const cartItems = JSON.parse(localStorage.getItem('sf_cart') || '[]');
                const enrolled = JSON.parse(localStorage.getItem('sf_enrolled_courses') || '[]');
                const newEnrolled = [...new Set([...enrolled, ...cartItems.map(c => c.id)])];
                localStorage.setItem('sf_enrolled_courses', JSON.stringify(newEnrolled));
                localStorage.removeItem('sf_cart');
                window.dispatchEvent(new Event('cart_updated'));
                alert('Payment successful! You are now enrolled in all courses.');
                setActiveView('mylearning');
              } else {
                const enrolled = JSON.parse(localStorage.getItem('sf_enrolled_courses') || '[]');
                if (!enrolled.includes(course.id)) {
                  localStorage.setItem('sf_enrolled_courses', JSON.stringify([...enrolled, course.id]));
                }
                alert(`Payment successful! Loading learning dashboard for "${course.title}"...`);
                handleStartCourse(course);
              }
            }}
          />
        )}
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
        {activeView === 'feedback' && (
          <FeedbackPage user={user} insideDashboard />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
