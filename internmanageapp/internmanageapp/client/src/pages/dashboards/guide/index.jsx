import React from 'react';
import { Outlet } from 'react-router-dom';
import DeveloperSidebar from '../../../components/developer/DeveloperSidebar';

const GuideDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <DeveloperSidebar />
      <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default GuideDashboard;