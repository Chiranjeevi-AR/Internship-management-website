import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaArrowLeft, FaCheck } from 'react-icons/fa';
import axios from '../../utils/axios';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetters: false,
    hasNumbers: false,
    hasSymbols: false,
    notSameAsOld: true
  });
  
  useEffect(() => {
  }, []);

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Password validation functions
  const validatePassword = (password, oldPassword = '') => {
    const validation = {
      minLength: password.length >= 6,
      hasLetters: /[a-zA-Z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSymbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
      notSameAsOld: oldPassword ? password !== oldPassword : true
    };
    return validation;
  };

  const isPasswordStrong = (validation) => {
    return validation.minLength && validation.hasLetters && validation.hasNumbers && validation.hasSymbols && validation.notSameAsOld;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Real-time password validation for new password
    if (name === 'newPassword') {
      const validation = validatePassword(value, formData.oldPassword);
      setPasswordValidation(validation);
    }
    
    // Check if old password changes, re-validate new password
    if (name === 'oldPassword' && formData.newPassword) {
      const validation = validatePassword(formData.newPassword, value);
      setPasswordValidation(validation);
    }
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Frontend validation
    const validation = validatePassword(formData.newPassword, formData.oldPassword);
    
    // Check minimum length
    if (!validation.minLength) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    // Check if passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    // Check if new password is same as old password
    if (!validation.notSameAsOld) {
      setError('New password must be different from your current password');
      setLoading(false);
      return;
    }
    
    // Check for strong password (optional but recommended)
    if (!isPasswordStrong(validation)) {
      setError('For better security, please use a combination of letters, numbers, and symbols');
      setLoading(false);
      return;
    }    try {
      // Make sure we're sending the exact fields the backend expects
      const response = await axios.patch('/api/auth/change-password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });
      
      if (response.data && response.data.success) {
        setSuccess(response.data.message || 'Your password has been successfully updated');
        
        // Clear form
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
          // Don't automatically redirect - let user see the success message and decide when to navigate back
      } else {
        setError(response.data?.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        if (err.response.data?.message === 'Invalid credentials!') {
          setError('Current password is incorrect');
        } else if (err.response.data?.message === 'You are not verified user!') {
          navigate('/verify-email');
        } else {
          setError(err.response.data?.message || 'Authentication error');
        }
      } else {
        setError(
          err.response?.data?.message || 
          err.message || 
          'An error occurred while updating your password'
        );
      }
    } finally {
      setLoading(false);
    }
  };  // Get user type to determine back link
  const userType = localStorage.getItem('userType');
  const roleMap = {
    'admin': '/dashboard/orgadmin',
    'hr': '/dashboard/non-tech',
    'developer': '/dashboard/guide',
    'intern': '/dashboard/intern',
    'candidate': '/internships'
  };
  // Set up a back link but don't navigate automatically
  const backLink = roleMap[userType] || '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <FaShieldAlt className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Change Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Keep your account secure with a strong password
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaCheck className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Current Password Field */}
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type={showPasswords.oldPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your current password"
                  value={formData.oldPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('oldPassword')}
                >
                  {showPasswords.oldPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.newPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('newPassword')}
                >
                  {showPasswords.newPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                >
                  {showPasswords.confirmPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Password...
                </>
              ) : (
                <>
                  <FaShieldAlt className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </button>

            {/* Back Button */}
            <Link 
              to={backLink}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </form>
        </div>

        {/* Password Requirements */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <FaShieldAlt className="mr-2 h-5 w-5 text-blue-600" />
            Password Requirements
          </h3>
          <div className="space-y-3">
            <div className={`flex items-center text-sm transition-colors ${
              passwordValidation.minLength ? 'text-green-600' : 'text-gray-600'
            }`}>
              {passwordValidation.minLength ? (
                <FaCheck className="h-4 w-4 mr-3 text-green-500" />
              ) : (
                <div className="h-2 w-2 bg-gray-400 rounded-full mr-3"></div>
              )}
              <span>Minimum 6 characters</span>
            </div>
            
            <div className={`flex items-center text-sm transition-colors ${
              passwordValidation.hasLetters ? 'text-green-600' : 'text-gray-600'
            }`}>
              {passwordValidation.hasLetters ? (
                <FaCheck className="h-4 w-4 mr-3 text-green-500" />
              ) : (
                <div className="h-2 w-2 bg-gray-400 rounded-full mr-3"></div>
              )}
              <span>Contains letters (a-z, A-Z)</span>
            </div>
            
            <div className={`flex items-center text-sm transition-colors ${
              passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-600'
            }`}>
              {passwordValidation.hasNumbers ? (
                <FaCheck className="h-4 w-4 mr-3 text-green-500" />
              ) : (
                <div className="h-2 w-2 bg-gray-400 rounded-full mr-3"></div>
              )}
              <span>Contains numbers (0-9)</span>
            </div>
            
            <div className={`flex items-center text-sm transition-colors ${
              passwordValidation.hasSymbols ? 'text-green-600' : 'text-gray-600'
            }`}>
              {passwordValidation.hasSymbols ? (
                <FaCheck className="h-4 w-4 mr-3 text-green-500" />
              ) : (
                <div className="h-2 w-2 bg-gray-400 rounded-full mr-3"></div>
              )}
              <span>Contains symbols (!@#$%^&* etc.)</span>
            </div>
            
            <div className={`flex items-center text-sm transition-colors ${
              passwordValidation.notSameAsOld ? 'text-green-600' : 'text-red-600'
            }`}>
              {passwordValidation.notSameAsOld ? (
                <FaCheck className="h-4 w-4 mr-3 text-green-500" />
              ) : (
                <div className="h-2 w-2 bg-red-400 rounded-full mr-3"></div>
              )}
              <span>Different from current password</span>
            </div>
            
            {formData.newPassword && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className={`text-sm font-medium ${
                  isPasswordStrong(passwordValidation) ? 'text-green-600' : 'text-orange-600'
                }`}>
                  Password Strength: {
                    isPasswordStrong(passwordValidation) ? (
                      <span className="text-green-600">Strong ✓</span>
                    ) : passwordValidation.minLength ? (
                      <span className="text-orange-600">Medium</span>
                    ) : (
                      <span className="text-red-600">Weak</span>
                    )
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
