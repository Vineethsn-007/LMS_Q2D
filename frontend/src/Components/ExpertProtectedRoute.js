import React from 'react';

const ExpertProtectedRoute = ({ user, children }) => {
  if (!user || user.role !== 'expert') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h2>Access Denied</h2>
        <p>You do not have expert validation permissions to view this page.</p>
      </div>
    );
  }

  return children;
};

export default ExpertProtectedRoute;
