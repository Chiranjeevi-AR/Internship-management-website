import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios'; // Ensure this path is correct
import SuccessModal from '../../../components/SuccessModal';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingOffer, setAcceptingOffer] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const acceptOffer = async (applicationId) => {
    setAcceptingOffer(applicationId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/applications/accept-offer/${applicationId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const { company, role, stipend } = response.data.data;
        
        // Show success modal with offer details and logout instruction
        setSuccessModalData({
          title: 'Welcome to Your Internship!',
          message: `Congratulations! You have successfully joined ${company} as a ${role}. ${stipend ? `Your stipend is ${stipend.currency} ${stipend.amount}. ` : ''}You will now be logged out. Please log back in to access your intern dashboard.`,
          buttonText: 'Continue'
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept offer. Please try again.');
    } finally {
      setAcceptingOffer(null);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Clear localStorage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get('/api/applications/my-applications');
      if (response.data && response.data.success) {
        setApplications(response.data.applications);
      } else {
        setError('Failed to load applications.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching applications.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading your applications...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Applications</h1>
      {applications.length === 0 ? (
        <p className="text-gray-600">You have not applied to any internships yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internship Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {app.internship?.title || 'N/A'} 
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.internship?.company || 'N/A'} {/* Corrected: Access app.internship.company directly */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      app.status === 'joined' ? 'bg-blue-100 text-blue-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {app.status === 'accepted' ? (
                      <button
                        onClick={() => acceptOffer(app._id)}
                        disabled={acceptingOffer === app._id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        {acceptingOffer === app._id ? 'Joining...' : 'Join Company'}
                      </button>
                    ) : app.status === 'joined' ? (
                      <span className="text-blue-600 font-medium text-sm">Already Joined</span>
                    ) : (
                      <span className="text-gray-400 text-sm">No action available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={successModalData.title}
        message={successModalData.message}
        buttonText={successModalData.buttonText}
      />
    </div>
  );
};

export default MyApplications;
