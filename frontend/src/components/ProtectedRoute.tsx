import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props{ children:React.ReactNode; }
export const ProtectedRoute:React.FC<Props> = ({children})=>{
  const auth=useAuth();
  if(!auth.token) return <Navigate to="/login" replace />;
  return <>{children}</>; 
};