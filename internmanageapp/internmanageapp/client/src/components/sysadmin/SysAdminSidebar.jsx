import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUsersCog, FaTasks, FaChartBar, FaCogs } from 'react-icons/fa'; // Added FaChartBar

const SysAdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    {
      name: 'Pending HR Approvals',
      path: '/dashboard/sysadmin/pending-approvals',
      icon: <FaUsersCog className="mr-3" />
    },
    {
      name: 'Manage Internships',
      path: '/dashboard/sysadmin/manage-internships',
      icon: <FaTasks className="mr-3" />
    },
    {
      name: 'Platform Statistics',
      path: '/dashboard/sysadmin/statistics',
      icon: <FaChartBar className="mr-3" /> // Added Statistics link and icon
    },
    // Add more system admin menu items here as needed, e.g.:
    // {
    //   name: 'System Settings',
    //   path: '/dashboard/sysadmin/settings',
    //   icon: <FaCogs className="mr-3" />
    // },
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
          <Link to="/dashboard/sysadmin" className="text-2xl font-bold hover:text-gray-300">
            System Admin
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
          © {new Date().getFullYear()} TallyIntern Admin
        </div>
      </div>
    </>
  );
};

export default SysAdminSidebar;
