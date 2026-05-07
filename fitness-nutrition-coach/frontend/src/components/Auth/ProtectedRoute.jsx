import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Protected Route Component
 * Prevents unauthenticated users from accessing protected pages
 * Checks both Redux state AND localStorage to handle 401 logout scenarios
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Also check localStorage to detect if a 401 cleared the token
  const hasToken = !!localStorage.getItem('access_token');
  
  // Only allow access if both Redux and localStorage agree user is authenticated
  if (!isAuthenticated || !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
