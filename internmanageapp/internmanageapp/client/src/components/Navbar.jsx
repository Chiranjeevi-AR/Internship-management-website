import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import useClickOutside from '../hooks/useClickOutside';
import LogoutModal from './LogoutModal';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Role mapping from backend to frontend
  const roleMap = {
    'admin': 'sysadmin',   // System Admin
    'hr': 'orgadmin',     // Organizational Admin (HR)
    'developer': 'guide',
    'intern': 'intern',
    'candidate': 'candidate'
  };
  
  const frontendRole = roleMap[userType] || '';
  
  // Use the custom hook for handling clicks outside the dropdown menu
  const userMenuRef = useClickOutside(() => {
    setUserMenuOpen(false);
  });
  
  // Fetch user data if token exists
  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          if (response.data && response.data.success) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Invalid token or session - clean up
          if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
          }
        }
      }
    };
    
    fetchUserData();
  }, [token]);

  const handleLogout = async () => {
    try {
      // Call the backend to clear the HTTP-only cookie
      await axios.post('/api/auth/signout');
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Clear the local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      navigate('/login');
    }
  };

  return (
    <>
      <nav className="bg-gray-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-white">TallyIntern</Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex md:hidden items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-gray-300 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
              <Link to="/internships" className="text-gray-300 hover:text-white">Internships</Link>
              <Link to="/about" className="text-gray-300 hover:text-white">About</Link>
              
              {!token ? (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                  <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Sign Up</Link>
                </>
              ) : (
                <>
                  {userType === 'candidate' ? (
                    <Link 
                      to="/dashboard/candidate/my-applications" 
                      className="text-gray-300 hover:text-white"
                    >
                      My Applications
                    </Link>
                  ) : (
                    <Link 
                      to={`/dashboard/${frontendRole}`} 
                      className="text-gray-300 hover:text-white"
                    >
                      Dashboard
                    </Link>
                  )}
                  <div className="relative" ref={userMenuRef}>
                    <button 
                      onClick={() => setUserMenuOpen(prev => !prev)}
                      className="text-gray-300 hover:text-white flex items-center focus:outline-none"
                    >
                      <span>{user?.email.split('@')[0] || 'User'}</span>
                      <svg className="ml-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
                        <Link 
                          to="/profile" 
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link 
                          to="/change-password?source=navbar" 
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Change Password
                        </Link>
                        <button
                          onClick={() => {
                            setShowLogoutModal(true);
                            setUserMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 pb-3 px-4">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/internships" 
                className="text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Internships
              </Link>
              <Link 
                to="/about" 
                className="text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              
              {!token ? (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-300 hover:text-white py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-blue-600 text-white px-4 py-2 my-1 rounded-md hover:bg-blue-700 inline-block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  {userType === 'candidate' ? (
                    <Link 
                      to="/dashboard/candidate/my-applications" 
                      className="text-gray-300 hover:text-white py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Applications
                    </Link>
                  ) : (
                    <Link 
                      to={`/dashboard/${frontendRole}`} 
                      className="text-gray-300 hover:text-white py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="text-gray-300 hover:text-white py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/change-password?source=navbar" 
                    className="text-gray-300 hover:text-white py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Change Password
                  </Link>
                  <button
                    onClick={() => {
                      setShowLogoutModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="text-gray-300 hover:text-white py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      <LogoutModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
      />
    </>
  );
};

export default Navbar;