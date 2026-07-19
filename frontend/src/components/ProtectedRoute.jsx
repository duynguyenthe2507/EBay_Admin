import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component
 * Props:
 *  - allowedRoles: array of allowed role strings
 *  - children
 */
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const auth = useSelector((state) => state.auth);
  const user = auth?.user;

  // Check if not authenticated
  if (!auth?.isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Check if no role restrictions
  if (!allowedRoles || allowedRoles.length === 0) {
    return children; // no restriction
  }

  // Check if user has one of the allowed roles
  if (user && allowedRoles.includes(user.role)) {
    return children;
  }

  // User is authenticated but doesn't have permission
  console.warn(`User role '${user?.role}' not in allowed roles: ${allowedRoles.join(', ')}`);
  return <Navigate to="/" replace />; // redirect to home
};

export default ProtectedRoute;
