import React from 'react';
import { Outlet } from 'react-router-dom';
import InternSidebar from '../../../components/intern/InternSidebar';

const InternDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <InternSidebar />
      <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default InternDashboard;