import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InternshipDetailsModal = ({ 
  isOpen, 
  onClose, 
  internship, 
  userType, 
  onApplyNow, 
  isApplied,
  onLoginRequired 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleApply = (event) => {
    if (userType === 'candidate') {
      if (!isApplied) {
        onApplyNow(internship._id || internship.id, event);
        handleClose();
      }
    } else {
      // User not logged in or not a candidate
      onLoginRequired();
    }
  };

  const stipendDisplay = internship?.stipend && internship.stipend.amount
    ? `${new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: internship.stipend.currency, 
        minimumFractionDigits: 0 
      }).format(internship.stipend.amount)}/month`
    : 'Not Disclosed';

  if (!isOpen || !internship) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="absolute inset-0 bg-black/10"></div>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative z-10">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold mb-2"
                >
                  {internship.role}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-blue-100 text-lg font-medium"
                >
                  {internship.company}
                </motion.p>
                
                {/* Quick Info Pills */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-3 mt-4"
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium">{internship.location}</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{internship.duration}</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{stipendDisplay}</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Job Description */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-50 rounded-xl p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      Job Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {internship.description || internship.jobDescription || 'Detailed job description will be provided during the application process.'}
                    </p>
                  </motion.div>

                  {/* Skills Required */}
                  {internship.skills && internship.skills.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gray-50 rounded-xl p-6"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        Skills Required
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {internship.skills.map((skill, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200"
                          >
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Eligibility */}
                  {internship.eligibility && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gray-50 rounded-xl p-6"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        Eligibility
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {internship.eligibility}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Details Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Start Date</span>
                        <span className="font-medium text-gray-900">
                          {internship.internshipStartDate ? new Date(internship.internshipStartDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">End Date</span>
                        <span className="font-medium text-gray-900">
                          {internship.internshipEndDate ? new Date(internship.internshipEndDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Duration</span>
                        <span className="font-medium text-gray-900">{internship.duration || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Openings</span>
                        <span className="font-medium text-gray-900">{internship.openings || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Stipend</span>
                        <span className="font-medium text-gray-900">{stipendDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Location</span>
                        <span className="font-medium text-gray-900">{internship.location || 'Not specified'}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Apply Button */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={handleApply}
                      disabled={isApplied && userType === 'candidate'}
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 ${
                        isApplied && userType === 'candidate'
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-2 border-gray-200'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl focus:ring-blue-300'
                      }`}
                    >
                      {isApplied && userType === 'candidate' ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Already Applied
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Apply for this Internship
                        </span>
                      )}
                    </button>
                  </motion.div>


                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InternshipDetailsModal;
