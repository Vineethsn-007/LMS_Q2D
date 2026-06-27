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
import AIAssistant from './AIAssistant';
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
                <button className="action-btn">
                  <Bell size={20} />
                  <span className="notification-badge">3</span>
                </button>
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
        {activeView === 'dashboard' && <DashboardContent user={user} />}
        {activeView === 'marketplace' && <Marketplace />}
        {activeView === 'mylearning' && <MyLearning />}
        {activeView === 'ai-assistant' && <AIAssistant user={user} />}

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
