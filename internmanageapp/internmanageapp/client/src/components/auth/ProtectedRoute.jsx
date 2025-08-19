import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from '../../utils/axios';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  
  // Role mapping from backend to frontend
  const roleMap = {
    'admin': 'sysadmin',     
    'hr': 'orgadmin',       
    'developer': 'guide',
    'intern': 'intern',
    'candidate': 'candidate',
  };
  
  const frontendRole = roleMap[userType] || '';

  useEffect(() => {
    const validateUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data && response.data.success) {
          setUser(response.data.user);
        } else {
          // Clear invalid session
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          setError('Invalid session');
        }
      } catch (err) {
        // If 401 error, token is invalid or expired
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
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (error || !user) {
    return <Navigate to="/login" />;
  }
  
  // Check verification status
  if (!user.verified) {
    return <Navigate to="/verify-email" state={{ email: user.email, userType: user.type }} />;
  }
  
  // Check approval status for roles that need it
  if (['intern', 'developer', 'hr'].includes(user.type) && !user.isApproved) {
    return <Navigate to="/pending-approval" state={{ userType: user.type }} />;
  }
  
  // Check role permissions only if allowedRoles is specified
  // If no allowedRoles provided, allow access to everyone who is logged in
  if (allowedRoles && !allowedRoles.includes(frontendRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;