import React from 'react';
import SysAdminSidebar from '../../../components/sysadmin/SysAdminSidebar';
import { Outlet } from 'react-router-dom';

const SysAdminDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <SysAdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SysAdminDashboard;
