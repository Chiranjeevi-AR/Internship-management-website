import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import axios from '../../utils/axios';

const RegisterForm = () => {
  const navigate = useNavigate();
  // If coming from VerifyEmail, pre-fill formData from location.state
  const location = window.location && window.location.state ? window.location : null;
  const initialFormData = (location && location.state && location.state.formData) ? location.state.formData : {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: 'candidate',
    company: ''
  };
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCompanyField, setShowCompanyField] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetters: false,
    hasNumbers: false,
    hasSymbols: false
  });
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companyLoading, setCompanyLoading] = useState(false);

  // Check if company field should be displayed based on type
  useEffect(() => {
    setShowCompanyField(['intern', 'developer', 'hr'].includes(formData.type));
  }, [formData.type]);

  // Fetch companies when type is developer or hr
  useEffect(() => {
    if (formData.type === 'developer' || formData.type === 'hr' || formData.type === 'intern') {
      setCompanyLoading(true);
      axios.get('/api/auth/all-companies')
        .then(res => {
          if (res.data && res.data.success) {
            setCompanyOptions(res.data.companies || []);
          } else {
            setCompanyOptions([]);
          }
        })
        .catch(() => setCompanyOptions([]))
        .finally(() => setCompanyLoading(false));
    }
  }, [formData.type]);

  // Password validation functions
  const validatePassword = (password) => {
    const validation = {
      minLength: password.length >= 6,
      hasLetters: /[a-zA-Z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSymbols: /[!@#$%^&*()_+=\[\]{};':"\\|,.<>/?~`]/.test(password)
    };
    return validation;
  };

  const isPasswordStrong = (validation) => {
    return validation.minLength && validation.hasLetters && validation.hasNumbers && validation.hasSymbols;
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Real-time password validation
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
    
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Frontend password validation
    const validation = validatePassword(formData.password);
    
    // Check minimum length
    if (!validation.minLength) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    // Check for strong password (all requirements)
    if (!isPasswordStrong(validation)) {
      setError('Password must contain letters, numbers, and symbols for better security');
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate company/institute field if required
    if ((formData.type === 'developer' || formData.type === 'hr') && !formData.company) {
      setError('Company name is required for this user type');
      setLoading(false);
      return;
    }
    if (formData.type === 'intern' && !formData.company) {
      setError('Company name is required for interns');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...data } = formData;
      
      // Remove company field if user type doesn't need it
      const registerData = ['intern', 'developer', 'hr'].includes(data.type) 
        ? data 
        : { name: data.name, email: data.email, password: data.password, type: data.type };
        
      const response = await axios.post('/api/auth/signup', registerData);
      
      // Check if we have the required data
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      // Don't store token yet since user needs to verify email
      // Redirect to verification page with email
      navigate('/verify-email', { 
        state: { 
          email: formData.email,
          userType: formData.type,
          message: response.data.message,
          justRegistered: true
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'An error occurred during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Start your journey! 🚀
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of professionals today
          </p>
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-purple-600 hover:text-purple-500 transition-colors">
              Sign in here
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
                  <span className="block sm:inline">{error}</span>
                </div>
              </div>
            )}
            
            <input type="hidden" name="remember" defaultValue="true" />
            
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPasswords.password ? "text" : "password"}
                    required
                    className="block w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility('password')}
                  >
                    {showPasswords.password ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    required
                    className="block w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Confirm your password"
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
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  I want to join as
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="candidate">Internship Candidate</option>
                  <option value="intern">Intern (requires approval)</option>
                  <option value="developer">Developer/Guide (requires approval)</option>
                  <option value="hr">HR Manager (requires approval)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {showCompanyField && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  {(formData.type === 'developer' || formData.type === 'hr' || formData.type === 'intern') ? (
                    <select
                      id="company"
                      name="company"
                      required={showCompanyField}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      value={formData.company}
                      onChange={handleChange}
                      disabled={companyLoading}
                    >
                      <option value="">{companyLoading ? 'Loading companies...' : 'Select your company'}</option>
                      {companyOptions.map((company, idx) => (
                        <option key={idx} value={company}>{company}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required={showCompanyField}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder={'Enter your company name'}
                      value={formData.company}
                      onChange={handleChange}
                    />
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Company name is required for Intern, Developer and HR roles
                  </p>
                </div>
              )}
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <svg className="h-4 w-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password Requirements
                </h4>
                <div className="space-y-2">
                  <div className={`flex items-center text-xs transition-colors ${
                    passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passwordValidation.minLength ? (
                      <FaCheck className="h-3 w-3 mr-2 text-green-500" />
                    ) : (
                      <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2"></div>
                    )}
                    <span>Minimum 6 characters</span>
                  </div>
                  
                  <div className={`flex items-center text-xs transition-colors ${
                    passwordValidation.hasLetters ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passwordValidation.hasLetters ? (
                      <FaCheck className="h-3 w-3 mr-2 text-green-500" />
                    ) : (
                      <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2"></div>
                    )}
                    <span>Contains letters (a-z, A-Z)</span>
                  </div>
                  
                  <div className={`flex items-center text-xs transition-colors ${
                    passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passwordValidation.hasNumbers ? (
                      <FaCheck className="h-3 w-3 mr-2 text-green-500" />
                    ) : (
                      <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2"></div>
                    )}
                    <span>Contains numbers (0-9)</span>
                  </div>
                  
                  <div className={`flex items-center text-xs transition-colors ${
                    passwordValidation.hasSymbols ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {passwordValidation.hasSymbols ? (
                      <FaCheck className="h-3 w-3 mr-2 text-green-500" />
                    ) : (
                      <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2"></div>
                    )}
                    <span>Contains symbols (!@#$%^&* etc.)</span>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className={`text-xs font-medium ${
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
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-200 ${
                  loading 
                    ? 'bg-purple-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transform hover:scale-[1.02] active:scale-[0.98]'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating your account...
                  </>
                ) : (
                  'Create My Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;