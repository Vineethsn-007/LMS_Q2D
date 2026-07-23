import React, { useState, useEffect } from 'react';
import './App.css';
import LandingHeader from './Components/Landing/LandingHeader';
import LandingHero from './Components/Landing/LandingHero';
import LandingMethodology from './Components/Landing/LandingMethodology';
import Footer from './Components/Footer';
import AuthModal from './Components/AuthModal';
import Dashboard from './Components/Dashboard/Dashboard';
import VerifyCertificate from './Components/Dashboard/VerifyCertificate';
import VerifyStudent from './Components/Dashboard/VerifyStudent';
import MockAssessment from './Components/MockAssessment';
import ExamPortal from './Components/Exam/ExamPortal';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activePage, setActivePage] = useState('home');

  // Check if token exists in localStorage on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('sf_token');
    const savedUser = localStorage.getItem('sf_user');
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('sf_token');
        localStorage.removeItem('sf_user');
      }
    }
  }, []);

  const handleAuthSuccess = (token, userData) => {
    setUser(userData);
    localStorage.setItem('sf_token', token);
    localStorage.setItem('sf_user', JSON.stringify(userData));
    sessionStorage.removeItem('sf_welcome_shown');
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    sessionStorage.removeItem('sf_welcome_shown');
  };

  const handleUserUpdate = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('sf_user', JSON.stringify(newUserData));
  };

  const handleStartFree = () => {
    if (!user) {
      setIsAuthOpen(true);
    }
  };

  const pathname = window.location.pathname;
  if (pathname.startsWith('/verify-student/')) {
    const studentId = decodeURIComponent(pathname.split('/verify-student/')[1] || '');
    return <VerifyStudent studentId={studentId} />;
  }
  if (pathname === '/verify-student') {
    return <VerifyStudent />;
  }
  if (pathname.startsWith('/verify/')) {
    const certId = decodeURIComponent(pathname.split('/verify/')[1] || '');
    return <VerifyCertificate certId={certId} />;
  }

  if (pathname.startsWith('/mock-assessment/')) {
    const bookingRef = decodeURIComponent(pathname.split('/mock-assessment/')[1] || '');
    return <MockAssessment bookingRef={bookingRef} />;
  }

  if (pathname.startsWith('/exam/take/')) {
    const credentialId = decodeURIComponent(pathname.split('/exam/take/')[1] || '');
    return <ExamPortal credentialId={credentialId} />;
  }

  return (
    <div className="App skillforge-gradient-bg">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
      ) : (
        <>
          <LandingHeader
            onOpenAuth={() => setIsAuthOpen(true)}
            setActivePage={setActivePage}
            activePage={activePage}
          />

          <main style={{ flexGrow: 1 }}>
            <div className="bg-white font-sans text-slate-600 antialiased">
              <LandingHero
                onStartFree={handleStartFree}
              />
              <LandingMethodology />
            </div>
          </main>

          <Footer setActivePage={setActivePage} />
        </>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
