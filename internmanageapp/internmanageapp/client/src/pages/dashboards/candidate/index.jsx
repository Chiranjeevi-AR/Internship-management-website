import React from 'react';
import { Outlet } from 'react-router-dom';

const CandidateDashboard = () => {
  return (
    <main className="flex-grow p-6 bg-gray-100 min-h-screen">
      <Outlet /> {/* This will render child routes like MyApplications or CandidateWelcome */}
    </main>
  );
};

export default CandidateDashboard;
