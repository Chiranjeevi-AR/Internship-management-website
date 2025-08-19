import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axios from '../../utils/axios';

const PendingUsersPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  // It's better to get user data from a more secure source like context or a hook if possible
  const userType = localStorage.getItem('userType'); 

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const response = await axios.get('/api/auth/pending-users');
        if (response.data.success) {
          setPendingUsers(response.data.pendingUsers || []);
        } else {
          setError(response.data.message || 'Failed to fetch pending users');
        }
      } catch (err) {
        console.error('Error fetching pending users:', err);
        setError(err.response?.data?.message || 'An error occurred while fetching pending users');
        
        // Redirect if unauthorized
        if (err.response?.status === 403) {
          navigate('/unauthorized');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, [navigate]);

  const handleApprove = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.patch(`/api/auth/approve-user/${userId}`);
      
      if (response.data.success) {
        setSuccessMessage('User approved successfully');
        // Remove the approved user from the list
        setPendingUsers(pendingUsers.filter(user => user._id !== userId));
      } else {
        setError(response.data.message || 'Failed to approve user');
      }
    } catch (err) {
      console.error('Error approving user:', err);
      setError(err.response?.data?.message || 'An error occurred while approving the user');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/api/auth/reject-user/${userId}`);
      
      if (response.data.success) {
        setSuccessMessage('User rejected successfully');
        // Remove the rejected user from the list
        setPendingUsers(pendingUsers.filter(user => user._id !== userId));
      } else {
        setError(response.data.message || 'Failed to reject user');
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError(err.response?.data?.message || 'An error occurred while rejecting the user');
    } finally {
      setLoading(false);
    }
  };

  // Format date to a readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Pending User Approvals</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : pendingUsers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No pending users to approve</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  {userType !== 'hr' && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Registered
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{user.type}</div>
                    </td>
                    {userType !== 'hr' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.company || '—'}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => handleApprove(user._id)}
                          className="text-green-600 hover:text-green-900"
                          disabled={loading}
                          title="Approve"
                        >
                          <FaCheck size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(user._id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={loading}
                          title="Reject"
                        >
                          <FaTimes size={18} />
                        </button>
                      </div>
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

export default PendingUsersPage;
