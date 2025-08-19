import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const PendingApproval = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userType } = location.state || {};
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/login');
  };

  // Generate appropriate message based on user type
  const getMessage = () => {
    switch (userType) {
      case 'intern':
      case 'developer':
        return 'Your account is pending approval from the HR manager of your company.';
      case 'hr':
        return 'Your account is pending approval from the system administrator.';
      default:
        return 'Your account is pending approval.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Account Pending Approval
          </h2>
          <div className="mt-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg text-gray-600 mb-4">
              {getMessage()}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You'll be able to access your dashboard once your account has been approved.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Home Page
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
