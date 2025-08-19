import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaBars, 
  FaTimes, 
  FaProjectDiagram, 
  FaLightbulb, 
  FaSearch, 
  FaClipboardList, 
  FaFileAlt,
  FaHome,
  FaUserGraduate
} from 'react-icons/fa';

const DeveloperSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
   /* {
      name: 'Dashboard',
      path: '/dashboard/guide',
      icon: <FaHome className="mr-3" />,
      exact: true
    },*/
    {
      name: 'Assigned Projects',
      path: '/dashboard/guide/assigned-projects',
      icon: <FaProjectDiagram className="mr-3" />
    },
    {
      name: 'Manage Assignments',
      path: '/dashboard/guide/assignments',
      icon: <FaClipboardList className="mr-3" />
    },
    {
      name: 'Intern Reports',
      path: '/dashboard/guide/reports',
      icon: <FaFileAlt className="mr-3" />
    },
    /*{
      name: 'Assigned Interns',
      path: '/dashboard/guide/interns',
      icon: <FaUserGraduate className="mr-3" />
    },*/
    {
      name: 'Volunteer Projects',
      path: '/dashboard/guide/available-projects',
      icon: <FaSearch className="mr-3" />
    },
    {
      name: 'Projects',
      path: '/dashboard/guide/projects',
      icon: <FaLightbulb className="mr-3" />
    },
    {
      name: 'Attendance',
      path: '/dashboard/guide/attendance',
      icon: <FaClipboardList className="mr-3" />
    }
  ];

  return (
    <>
      <button 
        onClick={toggleSidebar} 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      <div 
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out md:flex md:flex-col`}
      >
        <div className="p-5 border-b border-gray-700">
          <Link to="/dashboard/guide" className="text-2xl font-bold hover:text-gray-300">
            Developer Panel
          </Link>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => isOpen && setIsOpen(false)}
              className={`flex items-center px-4 py-2.5 rounded-md hover:bg-gray-700 transition-colors ${
                item.exact 
                  ? location.pathname === item.path ? 'bg-gray-700' : ''
                  : location.pathname.startsWith(item.path) ? 'bg-gray-700' : ''
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

export default DeveloperSidebar;
