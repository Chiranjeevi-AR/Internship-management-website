import React from 'react';
import { Link } from 'react-router-dom';

const DeveloperWelcome = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-xl rounded-2xl max-w-4xl mx-auto text-center p-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 animate-fade-in-down">
          🎯 Welcome, Developer! 🎯
        </h1>
        
        <p className="text-xl text-gray-600 mb-6 animate-fade-in-up">
          You are a <strong className="text-blue-600">Mentor/Developer</strong> in the TallyIntern system.
          <br />
          Use the sidebar to navigate through your projects and mentoring responsibilities.
        </p>
        
      
        
        <div className="bg-indigo-50 p-4 rounded-lg mt-8">
          <p className="text-lg text-gray-600">
            💡 You can use the features in the sidebar to navigate through the portal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeveloperWelcome;
