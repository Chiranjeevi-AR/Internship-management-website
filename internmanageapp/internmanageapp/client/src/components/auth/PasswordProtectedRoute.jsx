import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from '../../utils/axios';

/**
 * A special protected route for the change password page
 * that allows any authenticated user to access it
 */
const PasswordProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const validateUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data && response.data.success && response.data.user) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          setError('Invalid session or user data');
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
        }
        setError(err.message || 'Error validating session');
      } finally {
        setLoading(false);
      }
    };

    validateUser();
  }, [token, location.pathname]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} />;
  }
  
  if (error || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} />;
  }
  
  // Ensure user object is valid before accessing properties
  if (user && !user.verified) {
    return <Navigate to="/verify-email" state={{ email: user.email, userType: user.type, from: location.pathname }} />;
  }
  
  return children;
};

export default PasswordProtectedRoute;
