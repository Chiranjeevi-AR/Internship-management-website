import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { FaUserShield, FaBuilding, FaChartLine, FaCog, FaUsers, FaBriefcase, FaProjectDiagram, FaFileAlt, FaTasks, FaUserSlash, FaChartBar, FaSpinner } from 'react-icons/fa';

const OrgAdminWelcome = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/auth/me');
        if (response.data.success) {
          setUserData(response.data.user);
        } else {
          setError('Failed to fetch user data.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-blue-600">
          <FaSpinner className="animate-spin text-xl" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const { name, company } = userData || {};

  const features = [
    {
      icon: <FaUsers className="text-blue-600" />,
      title: "Pending Approvals",
      description: "Review and approve or reject new user registrations for your organization.",
      color: "bg-blue-50 border-blue-200"
    },
    {
      icon: <FaBriefcase className="text-green-600" />,
      title: "Manage Internships",
      description: "Create, view, update, and delete internship postings specific to your company.",
      color: "bg-green-50 border-green-200"
    },
    {
      icon: <FaFileAlt className="text-purple-600" />,
      title: "Manage Applications",
      description: "View and manage applications submitted by candidates for your internships.",
      color: "bg-purple-50 border-purple-200"
    },
    {
      icon: <FaProjectDiagram className="text-indigo-600" />,
      title: "Manage Projects",
      description: "Create, view, update, and delete projects within your organization.",
      color: "bg-indigo-50 border-indigo-200"
    },
    {
      icon: <FaTasks className="text-orange-600" />,
      title: "Manage Project Assignments",
      description: "Assign interns to projects and manage their assignments.",
      color: "bg-orange-50 border-orange-200"
    },
 /*  {
      icon: <FaUserSlash className="text-red-600" />,
      title: "Manage Blacklist",
      description: "View and manage blacklisted candidates.",
      color: "bg-red-50 border-red-200"
    },*/
    {
      icon: <FaChartBar className="text-teal-600" />,
      title: "Company Stats",
      description: "View statistics and analytics related to your organization's internship program.",
      color: "bg-teal-50 border-teal-200"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-white/20 p-3 rounded-full">
            <FaUserShield className="text-3xl" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome, {name || 'Organization Admin'}! 👋
            </h1>
            <div className="flex items-center space-x-2 text-blue-100">
              <FaBuilding className="text-lg" />
              <span className="text-xl">
                You are Organizational Admin of <strong className="text-white">{company || 'your organization'}</strong>
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-lg text-blue-50">
            This is your central hub for managing your organization's internship program on TallyIntern. 
            Use the features below to streamline your workflow and enhance your team's productivity.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Quick Access</p>
              <p className="text-2xl font-bold">Dashboard</p>
            </div>
            <FaChartLine className="text-3xl text-emerald-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Organization</p>
              <p className="text-2xl font-bold">{company || 'Company'}</p>
            </div>
            <FaBuilding className="text-3xl text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Role</p>
              <p className="text-2xl font-bold">HR Admin</p>
            </div>
            <FaCog className="text-3xl text-purple-200" />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FaProjectDiagram className="mr-3 text-blue-600" />
          Available Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`${feature.color} border rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-2xl mt-1">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default OrgAdminWelcome;
