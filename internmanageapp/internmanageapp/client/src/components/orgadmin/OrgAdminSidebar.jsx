import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUsersCog, FaBriefcase, FaFileAlt, FaTasks, FaProjectDiagram, FaUserSlash, FaChartBar } from 'react-icons/fa'; // Added FaChartBar

const OrgAdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    {
      name: 'Pending Approvals',
      path: '/dashboard/orgadmin/pending-users',
      icon: <FaUsersCog className="mr-3" />
    },
    {
      name: 'Manage Internships',
      path: '/dashboard/orgadmin/internships',
      icon: <FaBriefcase className="mr-3" />
    },
    {
      name: 'Manage Applications',
      path: '/dashboard/orgadmin/applications',
      icon: <FaFileAlt className="mr-3" />
    },
    {
      name: 'Manage Projects',
      path: '/dashboard/orgadmin/projects',
      icon: <FaProjectDiagram className="mr-3" />
    },
    {
      name: 'Manage Project Assignments',
      path: '/dashboard/orgadmin/project-assignments',
      icon: <FaTasks className="mr-3" />
    },
    /*{
      name: 'Manage Blacklist',
      path: '/dashboard/orgadmin/blacklist',
      icon: <FaUserSlash className="mr-3" />
    },*/
    {
      name: 'Company Stats',
      path: '/dashboard/orgadmin/company-stats',
      icon: <FaChartBar className="mr-3" />
    },
    {
      name: 'Attendance',
      path: '/dashboard/orgadmin/attendance',
      icon: <FaFileAlt className="mr-3" />
    }
    // Add more menu items here as needed
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button 
        onClick={toggleSidebar} 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar */}
      <div 
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out md:flex md:flex-col`}
      >
        <div className="p-5 border-b border-gray-700">
          <Link to="/dashboard/orgadmin" className="text-2xl font-bold hover:text-gray-300">
            Org Admin Panel
          </Link>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => isOpen && setIsOpen(false)} // Close mobile sidebar on link click
              className={`flex items-center px-4 py-2.5 rounded-md hover:bg-gray-700 transition-colors ${
                location.pathname.startsWith(item.path) ? 'bg-gray-700' : ''
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
          © {new Date().getFullYear()} TallyIntern
        </div>
      </div>
    </>
  );
};

export default OrgAdminSidebar;
