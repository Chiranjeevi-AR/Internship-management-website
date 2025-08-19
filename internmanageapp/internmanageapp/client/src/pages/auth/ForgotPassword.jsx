import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email input, 2: verification code, 3: new password
  const [formData, setFormData] = useState({
    email: '',
    providedCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);

  // Handle countdown timer for code resend
  React.useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSendCode = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch('/api/auth/send-forgot-password-code', { 
        email: formData.email 
      });
      
      if (response.data && response.data.success) {
        setSuccess('Verification code sent to your email');
        setStep(2);
        setRemainingTime(300); // 5 minute countdown
      } else {
        setError(response.data?.message || 'Failed to send verification code');
      }
    } catch (err) {
      console.error('Send code error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'An error occurred while sending the code'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.patch('/api/auth/verify-forgot-password-code', {
        email: formData.email,
        providedCode: formData.providedCode,
        newPassword: formData.newPassword
      });
      
      if (response.data && response.data.success) {
        setSuccess('Your password has been successfully updated');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data?.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'An error occurred while resetting your password'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <form className="mt-8 space-y-6" onSubmit={handleVerifyAndReset}>
      <div className="rounded-md shadow-sm space-y-2">
        <div>
          <label htmlFor="providedCode" className="sr-only">Verification Code</label>
          <input
            id="providedCode"
            name="providedCode"
            type="text"
            required
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Verification Code"
            value={formData.providedCode}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="sr-only">New Password</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="New Password"
            value={formData.newPassword}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="sr-only">Confirm New Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Confirm New Password"
            value={formData.confirmPassword}
            onChange={handleChange}
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
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        
        <button
          type="button"
          onClick={handleSendCode}
          disabled={loading || remainingTime > 0}
          className={`group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 ${
            loading || remainingTime > 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? 'Sending...' : remainingTime > 0 
            ? `Resend code in ${remainingTime}s` 
            : 'Resend verification code'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 1 
              ? 'Enter your email and we\'ll send you a reset code' 
              : 'Check your email for a verification code'}
          </p>
        </div>
        
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
        
        {step === 1 ? renderStep1() : renderStep2()}
        
        <div className="text-sm text-center">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
