import React from 'react';

const SuccessModal = ({ isOpen, onClose, title, message, buttonText = "Continue" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg 
              className="h-8 w-8 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            {message}
          </p>
          
          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
