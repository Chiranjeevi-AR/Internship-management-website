import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const CompanyCard = ({ internship, userType, onApplyNow, isApplied, onViewDetails }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stipendDisplay = internship.stipend && internship.stipend.amount
    ? `${new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: internship.stipend.currency, 
        minimumFractionDigits: 0 
      }).format(internship.stipend.amount)}/month`
    : 'Not Disclosed';

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(internship);
    }
  };

  const handleApplyClick = (event) => {
    if (onApplyNow) {
      onApplyNow(internship._id || internship.id, event);
    }
  };
  
  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
              {internship.role}
            </h3>
            {internship.company && (
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-700">{internship.company}</span>
              </div>
            )}
          </div>
          
          {/* Status badge */}
          {userType === 'candidate' && isApplied && (
            <div className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
              Applied
            </div>
          )}
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Location</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{internship.location}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Duration</p>
              <p className="text-sm font-semibold text-gray-900">{internship.duration}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Stipend</p>
              <p className="text-sm font-semibold text-gray-900">{stipendDisplay}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Openings</p>
              <p className="text-sm font-semibold text-gray-900">{internship.openings || 'Multiple'}</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        {internship.skills && internship.skills.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {internship.skills.slice(0, 3).map((skill, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200"
                >
                  {skill}
                </span>
              ))}
              {internship.skills.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  +{internship.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </span>
          </button>
          
          {(userType === 'candidate' || !userType) && (
            <button
              onClick={handleApplyClick}
              disabled={isApplied && userType === 'candidate'}
              className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 ${
                isApplied && userType === 'candidate'
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-2 border-gray-200 focus:ring-gray-100'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl focus:ring-blue-300'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {isApplied && userType === 'candidate' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Applied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Apply Now
                  </>
                )}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
