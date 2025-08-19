import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import { Link } from 'react-router-dom';

const InternDashboardHome = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/auth/me');
        if (response.data.success) {
          setUserData(response.data.user);
        } else {
          setError('Failed to fetch user data.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto p-4 md:p-6">
            <div className="text-center py-10 text-red-600 bg-red-100 border border-red-400 rounded-md p-4">{error}</div>
        </div>
    );
  }  const { name, internshipDetails, company: userCompany } = userData || {};
  const { company, internshipStartDate, internshipEndDate, role, applicationStatus } = internshipDetails || {};
  
  // Use company from internship details first, then fallback to user's company
  const displayCompany = company || userCompany;

  const renderInternshipInfo = () => {
    if (internshipDetails && internshipStartDate && internshipEndDate) {
      const statusMessage = applicationStatus === 'approved' 
        ? 'Your internship is confirmed!' 
        : applicationStatus === 'pending' 
        ? 'Your application is under review.' 
        : 'Internship details available.';
      
      const statusColor = applicationStatus === 'approved' 
        ? 'text-green-600' 
        : applicationStatus === 'pending' 
        ? 'text-yellow-600' 
        : 'text-blue-600';

      return (
        <div className="text-xl text-gray-600 mb-6 animate-fade-in-up">
          <p className="mb-2">
            You are an Intern at <strong className="text-blue-600">{displayCompany || 'your company'}</strong>
          </p>
          <p className="mb-2">
            Your tenure is from <strong className="text-green-600">{formatDate(internshipStartDate)}</strong> to <strong className="text-red-600">{formatDate(internshipEndDate)}</strong>
          </p>
          {applicationStatus && applicationStatus !== 'approved' && (
            <p className={`text-lg ${statusColor} font-medium`}>
              📋 {statusMessage}
            </p>
          )}
        </div>
      );
    } else if (displayCompany) {
      return (
        <div className="text-xl text-gray-600 mb-6 animate-fade-in-up">
          <p className="mb-2">
            You are an Intern at <strong className="text-blue-600">{displayCompany}</strong>
          </p>
          <p className="text-lg text-amber-600">
            📅 Your internship tenure details will be available once your application is processed.
          </p>
        </div>
      );
    } else {
      return (
        <p className="text-xl text-gray-600 mb-6 animate-fade-in-up">
          Welcome to your dashboard! Please complete your internship application to see your details.
        </p>
      );
    }
  };

  return (
    <div className="p-10 bg-white shadow-xl rounded-2xl max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 animate-fade-in-down">
            🎉 Welcome, <span className="text-indigo-600">{name || 'Intern'}</span>! 🎉
        </h1>
        
        {renderInternshipInfo()}
        
        <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <p className="text-lg text-gray-600">
                💡 You can use the features in the sidebar to navigate through the portal.
            </p>
        </div>
    </div>
  );
};

export default InternDashboardHome;
