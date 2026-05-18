import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'buyer' | 'farmer';
}

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const auth = useAuthContext();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && auth.user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
