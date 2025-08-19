import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../utils/axios'; // Ensure this path is correct
import { toast } from 'react-toastify';

const ManageBlacklist = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [blacklistedUsers, setBlacklistedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchBlacklistedUsers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await axios.get('/api/blacklist/hr/blacklisted');
      if (response.data && response.data.success) {
        setBlacklistedUsers(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch blacklisted users.');
      }
    } catch (error) {
      console.error("Error fetching blacklisted users:", error);
      setFetchError(error.response?.data?.message || error.message || 'Could not load blacklisted users.');
      toast.error(error.response?.data?.message || error.message || 'Could not load blacklisted users.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBlacklistedUsers();
  }, [fetchBlacklistedUsers]);

  const handleBlacklist = async (emailToBlacklist) => {
    if (!emailToBlacklist.trim()) {
      toast.warn('Please enter an email to blacklist.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/blacklist/hr/blacklist', { candidateEmail: emailToBlacklist });
      if (response.data && response.data.success) {
        toast.success(response.data.message);
        fetchBlacklistedUsers(); // Refresh the list
        setSearchEmail(''); // Clear search input
      } else {
        throw new Error(response.data.message || 'Failed to blacklist user.');
      }
    } catch (error) {
      console.error("Error blacklisting user:", error);
      toast.error(error.response?.data?.message || error.message || 'Could not blacklist user.');
    }
    setIsLoading(false);
  };

  const handleUnblacklist = async (emailToUnblacklist) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/blacklist/hr/unblacklist', { candidateEmail: emailToUnblacklist });
      if (response.data && response.data.success) {
        toast.success(response.data.message);
        fetchBlacklistedUsers(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to unblacklist user.');
      }
    } catch (error) {
      console.error("Error unblacklisting user:", error);
      toast.error(error.response?.data?.message || error.message || 'Could not unblacklist user.');
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Candidate Blacklist</h1>

      <div className="mb-8 p-6 border border-gray-200 rounded-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Add to Blacklist</h2>
        <div className="flex items-center space-x-3">
          <input 
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Enter candidate email to blacklist"
            className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => handleBlacklist(searchEmail)}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Blacklist Email'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Currently Blacklisted Users</h2>
        {fetchError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{fetchError}</p>}
        {isLoading && !blacklistedUsers.length && <p>Loading blacklisted users...</p>}
        {!isLoading && !fetchError && blacklistedUsers.length === 0 && (
          <p className="text-gray-600">No users are currently blacklisted by your company.</p>
        )}
        {blacklistedUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blacklistedUsers.map((user) => (
                  <tr key={user.email}> {}                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleUnblacklist(user.email)}
                        disabled={isLoading}
                        className="text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : 'Remove from Blacklist'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBlacklist;
