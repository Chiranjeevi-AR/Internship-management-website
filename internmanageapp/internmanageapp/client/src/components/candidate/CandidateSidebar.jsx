import React from 'react';
import { NavLink } from 'react-router-dom';

const CandidateSidebar = () => {
  const activeClassName = "bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium";
  const inactiveClassName = "text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium";

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <nav className="space-y-2">
        <NavLink
          to="/dashboard/candidate"
          end // Important for the parent route to not stay active for child routes
          className={({ isActive }) => isActive ? activeClassName : inactiveClassName}
        >
          Dashboard Home
        </NavLink>
        <NavLink
          to="/dashboard/candidate/my-applications"
          className={({ isActive }) => isActive ? activeClassName : inactiveClassName}
        >
          My Applications
        </NavLink>
        {/* Add other candidate-specific links here */}
      </nav>
    </aside>
  );
};

export default CandidateSidebar;
