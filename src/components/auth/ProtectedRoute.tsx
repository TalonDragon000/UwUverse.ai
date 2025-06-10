import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session } = useAuthStore();
  
  if (!session) {
    return <Navigate to="/auth\" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;