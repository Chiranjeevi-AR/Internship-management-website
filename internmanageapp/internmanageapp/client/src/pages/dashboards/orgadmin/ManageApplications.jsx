import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaDownload, FaCheckCircle, FaTimesCircle, FaFilter, FaTrashAlt, FaInfoCircle, FaTimes, FaUser, FaBriefcase, FaMapMarkerAlt, FaClock, FaCalendarAlt } from 'react-icons/fa'; // Added more icons
import axiosInstance from '../../../utils/axios';
import { toast } from 'react-toastify';
// import ApplicationDetailsModal from '../../../components/common/ApplicationDetailsModal'; // We'll create this if needed
import ConfirmationModal from '../../../components/common/ConfirmationModal';

const ManageApplications = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState(''); // For potential future search by candidate name/email
  const [statusFilter, setStatusFilter] = useState(''); // '', 'pending', 'reviewed', 'accepted', 'rejected'
  const [internshipFilter, setInternshipFilter] = useState(''); // To filter by specific internship ID

  // State for modals
  // const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);

  // New state for candidate and internship info modals
  const [isCandidateInfoModalOpen, setIsCandidateInfoModalOpen] = useState(false);
  const [isInternshipInfoModalOpen, setIsInternshipInfoModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [isLoadingInternship, setIsLoadingInternship] = useState(false);

  const fetchApplications = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        internshipId: internshipFilter || undefined,
        // search: searchTerm || undefined, // If backend supports search
      };
      const response = await axiosInstance.get('/api/applications/hr/view', { params }); // Added /api prefix
      setApplications(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err.response?.data?.message || 'Failed to fetch applications.');
      toast.error(err.response?.data?.message || 'Failed to fetch applications.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, statusFilter, internshipFilter]);

  useEffect(() => {
    fetchApplications(pagination.currentPage);
  }, [fetchApplications, pagination.currentPage]);

  const handleStatusUpdate = async () => {
    if (!selectedApplication || !actionType) return;

    const newStatus = actionType === 'approve' ? 'accepted' : 'rejected';
    
    // Close modal instantly
    setIsConfirmModalOpen(false);
    setSelectedApplication(null);
    setActionType('');

    // Show loading state for the specific application
    setApplications(prevApplications =>
      prevApplications.map(app =>
        app._id === selectedApplication._id ? { ...app, isUpdating: true } : app
      )
    );

    try {
      const response = await axiosInstance.patch(`/api/applications/hr/status/${selectedApplication._id}`, { status: newStatus });

      // Update the application status in the local state
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app._id === selectedApplication._id ? { ...app, status: newStatus, isUpdating: false } : app
        )
      );

      toast.success(response.data.message || `Application ${newStatus} successfully.`);
    } catch (err) {
      console.error(`Error ${actionType}ing application:`, err);
      toast.error(err.response?.data?.message || `Failed to ${actionType} application.`);
      
      // Remove loading state and refresh data on error
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app._id === selectedApplication._id ? { ...app, isUpdating: false } : app
        )
      );
      fetchApplications(pagination.currentPage);
    }
  };

  const openConfirmationModal = (application, type) => {
    setSelectedApplication(application);
    setActionType(type);
    setIsConfirmModalOpen(true);
  };

  const openDeleteConfirmationModal = (application) => {
    setApplicationToDelete(application);
    setIsDeleteConfirmModalOpen(true);
  };

  const openCandidateInfoModal = (application) => {
    setSelectedCandidate(application);
    setIsCandidateInfoModalOpen(true);
  };

  const openInternshipInfoModal = async (application) => {
    setIsInternshipInfoModalOpen(true);
    setIsLoadingInternship(true);
    setSelectedInternship(null);

    try {
      // Fetch full internship details from the database
      const response = await axiosInstance.get(`/api/internships/${application.internshipId._id}`);
      setSelectedInternship(response.data.data);
    } catch (err) {
      console.error('Error fetching internship details:', err);
      toast.error('Failed to fetch internship details');
      // Fallback to the internship data from the application
      setSelectedInternship(application.internshipId);
    } finally {
      setIsLoadingInternship(false);
    }
  };

  const handleDeleteApplication = async () => {
    if (!applicationToDelete) return;
    setIsLoading(true); // Use general loading state for modal spinner
    let refreshNeeded = false;
    try {
      await axiosInstance.delete(`/api/applications/hr/delete/${applicationToDelete._id}`);
      toast.success('Application deleted successfully.');
      refreshNeeded = true;
    } catch (err) {
      console.error('Error deleting application:', err);
      toast.error(err.response?.data?.message || 'Failed to delete application.');
    } finally {
      setIsLoading(false);
      setIsDeleteConfirmModalOpen(false);
      setApplicationToDelete(null);
    }
    if (refreshNeeded) {
      fetchApplications(pagination.currentPage);
    }
  };

  const handleDownloadResume = async (applicationId, filename) => {
    try {
      const response = await axiosInstance.get(`/api/applications/hr/resume/${applicationId}`, {
        responseType: 'blob', // Important for file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'resume.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Resume downloaded.');
    } catch (err) {
      console.error("Error downloading resume:", err);
      let errorMessage = 'Failed to download resume.';
      if (err.response && err.response.data && err.response.data instanceof Blob) {
        try {
          // Try to read the Blob as text, then parse as JSON
          const errorText = await err.response.data.text();
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          console.error("Could not parse error response blob:", parseError);
          // Fallback to generic message or statusText if parsing fails
          errorMessage = err.response.statusText || errorMessage;
        }
      } else if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }
      toast.error(errorMessage);
    }
  };
  
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Applications</h1>
        
        {isLoading && <p className="text-center text-gray-600 py-4">Loading applications...</p>}
        {error && <p className="text-center text-red-500 py-4">Error: {error}</p>}
        
        {!isLoading && !error && applications.length === 0 && (
          <p className="text-center text-gray-600 py-4">No applications found for your company.</p>
        )}

        {!isLoading && !error && applications.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internship Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{app.fullName || app.userId?.email || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{app.userId?.email || 'No email'}</div>
                          </div>
                          <button
                            onClick={() => openCandidateInfoModal(app)}
                            title="View Candidate Details"
                            className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <FaInfoCircle size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{app.internshipId?.role || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{app.internshipId?.company || 'N/A'}</div>
                          </div>
                          <button
                            onClick={() => openInternshipInfoModal(app)}
                            title="View Internship Details"
                            className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <FaInfoCircle size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {/* <button 
                          // onClick={() => openDetailsModal(app)} 
                          title="View Details"
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <FaEye size={18} />
                        </button> */}
                        <button 
                          onClick={() => handleDownloadResume(app._id, app.resume?.filename)}
                          title="Download Resume"
                          disabled={!app.resume?.filename}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaDownload size={18} />
                        </button>
                        {(app.status === 'pending' || app.status === 'reviewed') ? (
                          <>
                            <button 
                              onClick={() => openConfirmationModal(app, 'approve')}
                              title="Approve Application"
                              className="text-green-600 hover:text-green-900 transition-colors"
                            >
                              <FaCheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => openConfirmationModal(app, 'reject')}
                              title="Reject Application"
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              <FaTimesCircle size={18} />
                            </button>
                          </>
                        ) : (
                          // Show delete for processed applications (accepted/rejected)
                          <button
                            onClick={() => openDeleteConfirmationModal(app)}
                            title="Delete Application Record"
                            className="text-red-600 hover:text-red-900 transition-colors ml-2"
                          >
                            <FaTrashAlt size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalApplications})
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages || isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {/* <ApplicationDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        application={selectedApplication} 
      /> */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleStatusUpdate}
        title={`Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
        message={`Are you sure you want to ${actionType} this application? ${actionType === 'approve' ? 'The candidate will be notified and their role updated to Intern.' : ''}`}
        confirmText={actionType === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
        cancelText="Cancel"
        confirmButtonColor={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        onConfirm={handleDeleteApplication}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete this application record? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />

      {/* Candidate Information Modal */}
      {isCandidateInfoModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-0 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-2xl rounded-lg bg-white max-h-screen overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center">
                  <FaUser className="mr-3 text-2xl" />
                  Candidate Profile
                </h3>
                <button
                  onClick={() => setIsCandidateInfoModalOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-green-500">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-1">Full Name</h5>
                      <p className="text-gray-800 text-lg">
                        {selectedCandidate.fullName || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-1">Email Address</h5>
                      <p className="text-gray-800">
                        {selectedCandidate.userId?.email || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-1">GitHub Profile</h5>
                      {selectedCandidate.githubId ? (
                        <a 
                          href={selectedCandidate.githubId} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {selectedCandidate.githubId}
                        </a>
                      ) : (
                        <p className="text-gray-500">Not provided</p>
                      )}
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-1">LinkedIn Profile</h5>
                      {selectedCandidate.linkedinId ? (
                        <a 
                          href={selectedCandidate.linkedinId} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {selectedCandidate.linkedinId}
                        </a>
                      ) : (
                        <p className="text-gray-500">Not provided</p>
                      )}
                    </div>
                  </div>
                  {selectedCandidate.codingPlatformsId && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-gray-700 mb-1">LeetCode Profile URL</h5>
                      <a 
                        href={selectedCandidate.codingPlatformsId} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {selectedCandidate.codingPlatformsId}
                      </a>
                    </div>
                  )}
                  {selectedCandidate.address && (
                    <div className="mt-4">
                      <h5 className="font-semibold text-gray-700 mb-1">Address</h5>
                      <p className="text-gray-800">
                        {selectedCandidate.address}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                {selectedCandidate.coverLetter && (
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-3 text-lg">Cover Letter</h5>
                    <div className="bg-white p-4 rounded border max-h-40 overflow-y-auto">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedCandidate.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedCandidate.skills && (
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-purple-800 mb-3 text-lg">Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedCandidate.skills) 
                        ? selectedCandidate.skills 
                        : selectedCandidate.skills.split(',').map(skill => skill.trim())
                      ).map((skill, index) => (
                        <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h5 className="font-semibold text-gray-700 mb-2">Application Date</h5>
                    <p className="text-gray-600">
                      {new Date(selectedCandidate.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h5 className="font-semibold text-gray-700 mb-2">Resume</h5>
                    {selectedCandidate.resume?.filename ? (
                      <button
                        onClick={() => handleDownloadResume(selectedCandidate._id, selectedCandidate.resume.filename)}
                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 flex items-center text-sm font-medium"
                      >
                        <FaDownload className="mr-2" size={14} />
                        Download Resume
                      </button>
                    ) : (
                      <p className="text-gray-500">No resume uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsCandidateInfoModalOpen(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internship Information Modal */}
      {isInternshipInfoModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-0 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-2xl rounded-lg bg-white max-h-screen overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center">
                  <FaBriefcase className="mr-3 text-2xl" />
                  Internship Details
                </h3>
                <button
                  onClick={() => setIsInternshipInfoModalOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
              {isLoadingInternship ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading internship details...</span>
                </div>
              ) : selectedInternship ? (
                <div className="space-y-6">
                  {/* Title and Company Section */}
                  <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Position</h4>
                        <p className="text-xl font-bold text-blue-600">
                          {selectedInternship.role || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Company</h4>
                        <p className="text-xl font-bold text-gray-700">
                          {selectedInternship.company || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Stipend */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <h5 className="font-semibold text-green-800">Stipend</h5>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {selectedInternship.stipend 
                          ? (typeof selectedInternship.stipend === 'object' 
                              ? `${selectedInternship.stipend.currency === 'USD' ? '$' : '₹'}${Number(selectedInternship.stipend.amount || 0).toLocaleString()}`
                              : `₹${Number(selectedInternship.stipend).toLocaleString()}`)
                          : 'Not specified'}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        <h5 className="font-semibold text-purple-800">Duration</h5>
                      </div>
                      <p className="text-lg font-bold text-purple-700">
                        {selectedInternship.duration || 'Not specified'}
                      </p>
                    </div>

                    {/* Work Type */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        <h5 className="font-semibold text-orange-800">Work Type</h5>
                      </div>
                      <p className="text-lg font-bold text-orange-700">
                        {selectedInternship.type || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Job Description */}
                  {selectedInternship.jobDescription && (
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-blue-800 mb-3 text-lg">Job Description</h5>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedInternship.jobDescription}
                      </p>
                    </div>
                  )}

                  {/* Skills Required */}
                  {selectedInternship.skills && selectedInternship.skills.length > 0 && (
                    <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                      <h5 className="font-semibold text-indigo-800 mb-3 text-lg">Required Skills</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedInternship.skills.map((skill, index) => (
                          <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  {selectedInternship.expectedSalary && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 max-w-md">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <h5 className="font-semibold text-yellow-800">Expected Salary</h5>
                      </div>
                      <p className="text-lg font-bold text-yellow-700">
                        ₹{Number(selectedInternship.expectedSalary).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Posted Information */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        <strong>Posted on:</strong> {selectedInternship.createdAt 
                          ? new Date(selectedInternship.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Not available'}
                      </span>
                      {selectedInternship.updatedAt && selectedInternship.updatedAt !== selectedInternship.createdAt && (
                        <span>
                          <strong>Last updated:</strong> {new Date(selectedInternship.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500">No internship details available</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsInternshipInfoModalOpen(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageApplications;
