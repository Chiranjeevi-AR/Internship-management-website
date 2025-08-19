import React from 'react';
import { FaCalendarCheck } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const AttendanceSidebarItem = () => {
  const location = useLocation();
  return (
    <Link
      to="/dashboard/intern/attendance"
      className={`flex items-center px-4 py-2.5 rounded-md hover:bg-gray-700 transition-colors ${
        location.pathname.startsWith('/dashboard/intern/attendance') ? 'bg-gray-700' : ''
      }`}
    >
      <FaCalendarCheck className="mr-3" />
      Attendance
    </Link>
  );
};

export default AttendanceSidebarItem;
