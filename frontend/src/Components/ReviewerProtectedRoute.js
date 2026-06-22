import React from 'react';

const ReviewerProtectedRoute = ({ user, children }) => {
  if (!user || (user.role !== 'reviewer' && user.role !== 'admin')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
};

export default ReviewerProtectedRoute;
