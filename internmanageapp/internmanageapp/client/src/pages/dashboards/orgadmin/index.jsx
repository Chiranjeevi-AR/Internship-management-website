import React from 'react';
import { Outlet } from 'react-router-dom';
import OrgAdminSidebar from '../../../components/orgadmin/OrgAdminSidebar';

const OrgAdminDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <OrgAdminSidebar />
      <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
        <Outlet /> {/* This is where nested route components will render */}
      </main>
    </div>
  );
};

export default OrgAdminDashboard;