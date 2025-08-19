import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, userType, message, justRegistered } = location.state || {};
  // List of companies for dropdown (fetched dynamically)
  const [companyList, setCompanyList] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  // Fetch companies from backend on mount if intern/developer/hr
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('/api/companies/list');
        if (response.data && Array.isArray(response.data.companies)) {
          setCompanyList(response.data.companies);
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };
    if (userType === 'intern' || userType === 'developer' || userType === 'hr') {
      fetchCompanies();
    }
  }, [userType]);
  // Handler for going back to signup with previous details
  const handleBackToSignup = () => {
    // Pass only the original formData back to RegisterForm
    navigate('/register', { state: { formData: location.state?.formData } });
  };
  
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const initialCodeSendAttempted = useRef(false); // <-- Use a ref instead of state

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return; 
    }
    
    if (email && justRegistered && !initialCodeSendAttempted.current) { 
      initialCodeSendAttempted.current = true;
      handleSendCode(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, justRegistered, navigate]);

  useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);
  const handleSendCode = async () => {
    setSending(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch('/api/auth/send-verification-code', { email });
      
      if (response.data && response.data.success) {
        setSuccess('Verification code sent to your email');
        setRemainingTime(300); // 5 minute countdown
      } else {
        setError(response.data?.message || 'Failed to send verification code');
      }
    } catch (err) {
      console.error('Send verification code error:', err);
      console.error('Error details:', err.response?.data);
      setError(
        err.response?.data?.message || 
        err.message || 
        'An error occurred while sending verification code'
      );
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!verificationCode || verificationCode.length < 4) {
      setError('Please enter a valid verification code');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.patch('/api/auth/verify-verification-code', { 
        email, 
        providedCode: verificationCode 
      });
      
      if (response.data && response.data.success) {
        setSuccess('Email successfully verified');
        
        // Save the updated token if provided
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userType', userType);
        }
        
        // Redirect based on user type after a short delay
        setTimeout(() => {
          // Map user types to dashboard routes
          const dashboardMap = {
            'admin': '/dashboard/orgadmin',
            'hr': '/dashboard/non-tech',
            'developer': '/dashboard/guide',
            'intern': '/dashboard/intern',
            'candidate': '/internships'
          };
          
          // If user type requires approval, redirect to pending page
          if (['intern', 'developer', 'hr'].includes(userType)) {
            navigate('/pending-approval', { state: { userType } });
          } else {
            // Otherwise redirect to dashboard
            const dashboardRoute = dashboardMap[userType] || '/';
            navigate(dashboardRoute);
          }
        }, 1500);
      } else {
        setError(response.data?.message || 'Failed to verify email');
      }
    } catch (err) {
      console.error('Verify code error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Invalid verification code'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {message || `We've sent a verification code to ${email}`}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              {success}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="verification-code" className="sr-only">Verification Code</label>
              <input
                id="verification-code"
                name="verification-code"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sending || remainingTime > 0}
              className={`group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 ${
                sending || remainingTime > 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {sending ? 'Sending...' : remainingTime > 0 
                ? `Resend code in ${remainingTime}s` 
                : 'Resend verification code'}
            </button>
            <button
              type="button"
              onClick={handleBackToSignup}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to Signup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
