import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axios';
import { FaChartBar, FaBuilding, FaUsers, FaUserTie, FaBriefcase, FaSpinner, FaUserFriends, FaUserCog } from 'react-icons/fa'; // Added more icons

const SysAdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/api/stats/platform-overview');
        setStats(response.data.data);
      } catch (err) {
        console.error("Error fetching platform stats:", err);
        setError(err.response?.data?.message || 'Failed to fetch platform statistics. Please try again later.');
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <FaSpinner className="animate-spin text-blue-500 text-4xl" />
        <p className="ml-3 text-lg text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-10 text-red-600 bg-red-100 border border-red-400 rounded-md p-4">
          <p className="text-xl font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-10 text-gray-500">
          No statistics data available at the moment.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center">
        <FaChartBar className="mr-3 text-blue-600" /> Platform Statistics
      </h1>

      {/* Overall Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-3">
            <FaBuilding className="text-3xl text-blue-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Registered Companies</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalCompanies || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-3">
            <FaUsers className="text-3xl text-green-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Platform Users</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalUsers || 0}</p> 
              {/* totalUsers is the count of the entire users collection */}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-3">
            <FaUserFriends className="text-3xl text-yellow-500 mr-4" /> 
            <div>
              <p className="text-sm text-gray-500">Registered Candidates</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalCandidates || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center mb-3">
            <FaBriefcase className="text-3xl text-purple-500 mr-4" />
            <div>
              <p className="text-sm text-gray-500">Total Internship Openings</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalOpenings || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Specific Stats */}
      <h2 className="text-2xl font-semibold mb-6 text-gray-700">Company Breakdown</h2>
      {stats.companyWiseData && stats.companyWiseData.length > 0 ? (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Interns</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Developers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">HR Personnel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.companyWiseData.map((company) => (
                <tr key={company.companyName} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{company.numberOfInterns || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{company.numberOfDevelopers || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{company.numberOfHR || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow p-6">
          <p>No detailed company statistics available.</p>
        </div>
      )}
    </div>
  );
};

export default SysAdminStats;
