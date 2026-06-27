import React from 'react';

const AdminProtectedRoute = ({ user, children }) => {
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h2>Access Denied</h2>
        <p>You do not have administrative permissions to view this page.</p>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;
