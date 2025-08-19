import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/axios';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Check if user already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType'); // This is the backend userType
    if (token && userType) {
      // Updated dashboardMap for already logged-in users
      const dashboardMap = {
        'admin': '/dashboard/sysadmin',     // System Admin
        'hr': '/dashboard/orgadmin',        // Organizational Admin (HR)
        'developer': '/dashboard/guide',
        'intern': '/dashboard/intern',
        'candidate': '/internships'         // Candidates go to internships list
      };
      
      const dashboardRoute = dashboardMap[userType] || '/';
      navigate(dashboardRoute);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/signin', formData);
      //console.log('Login response:', response.data); // Debug log

      // Check if we have the required data
      if (!response.data || response.data.success !== true) {
        throw new Error('Invalid response from server');
      }

      // Store token and user type
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', response.data.type);
      
      // Check if user needs to verify email
      if (response.data.token) {
        // Decode the JWT token to get user info
        const payload = JSON.parse(atob(response.data.token.split('.')[1]));
        
        if (!payload.verified) {
          setNeedsVerification(true);
          navigate('/verify-email', { 
            state: { 
              email: formData.email,
              userType: response.data.type
            } 
          });
          return;
        }
        
        // Check if user is approved based on role
        if (['intern', 'developer', 'hr'].includes(payload.type) && !payload.isApproved) {
          navigate('/pending-approval', { 
            state: { 
              userType: payload.type
            } 
          });
          return;
        }
        
        // Updated dashboardMap for redirection after successful login
        const dashboardMap = {
          'admin': '/dashboard/sysadmin',     // System Admin
          'hr': '/dashboard/orgadmin',        // Organizational Admin (HR)
          'developer': '/dashboard/guide',
          'intern': '/dashboard/intern',
          'candidate': '/internships'         // Candidates go to internships list
        };
        
        const dashboardRoute = dashboardMap[payload.type] || '/'; // payload.type is backend userType
        navigate(dashboardRoute);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'An error occurred during login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-gray-600 mb-6">
            Ready to continue your journey?
          </p>
          <p className="text-sm text-gray-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
              Join the community
            </Link>
          </p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white pr-12"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-4 inset-y-0 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364-2.364A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.636-1.364M9.88 9.88l4.24 4.24" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.828-2.828A9.956 9.956 0 0122 12c0 5.523-4.477 10-10 10S2 17.523 2 12c0-2.21.896-4.21 2.343-5.657" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-200 ${
                  loading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] active:scale-[0.98]'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing you in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;