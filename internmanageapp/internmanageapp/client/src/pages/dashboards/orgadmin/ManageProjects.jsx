import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaProjectDiagram, FaCheckCircle, FaTimesCircle, FaTimes } from 'react-icons/fa'; // Added FaCheckCircle, FaTimesCircle, FaTimes
import axiosInstance from '../../../utils/axios';
import ProjectFormModal from '../../../components/orgadmin/ProjectFormModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { getUserPayloadFromToken } from '../../../utils/authUtils';

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]); // Store all projects for client-side filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [actionError, setActionError] = useState(null); // For modal errors
  const [actionLoading, setActionLoading] = useState(false); // For modal loading
  const [currentUserCompany, setCurrentUserCompany] = useState('');

  // New state for approve/reject confirmation
  const [isApproveRejectModalOpen, setIsApproveRejectModalOpen] = useState(false);
  const [projectForApproval, setProjectForApproval] = useState(null);
  const [approvalActionType, setApprovalActionType] = useState(''); // 'approve' or 'reject'

  useEffect(() => {
    const payload = getUserPayloadFromToken();
    if (payload && payload.company) {
      setCurrentUserCompany(payload.company);
    } else {
      console.warn('Could not retrieve company from token for ManageProjects.');
    }
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, searchTerm]);

  const fetchProjects = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    setError(null); // Clear previous main page errors
    try {
      const response = await axiosInstance.get('/api/projects/all', {
        params: { page, limit, search },
      });
      const fetchedProjects = response.data.data || [];
      setProjects(fetchedProjects);
      setAllProjects(fetchedProjects); // Store all projects for client-side filtering
      setTotalPages(response.data.pagination?.totalPages || 1);
      setCurrentPage(response.data.pagination?.currentPage || 1);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.response?.data?.message || 'Failed to fetch projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Client-side filtering for better search experience
  const filteredProjects = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return allProjects;
    }

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    
    // Helper function for word-boundary matching to avoid false positives
    const matchesSearch = (text, searchTerm) => {
      if (!text) return false;
      const textLower = text.toLowerCase();
      
      // For short search terms (1-2 chars), use stricter word-boundary matching
      if (searchTerm.length <= 2) {
        const words = textLower.split(/\s+/);
        return words.some(word => word.startsWith(searchTerm));
      }
      
      // For longer search terms, use contains matching
      return textLower.includes(searchTerm);
    };

    return allProjects.filter(project => {
      const nameMatch = matchesSearch(project.name, searchLower);
      const skillsMatch = Array.isArray(project.skillRequirement) 
        ? project.skillRequirement.some(skill => matchesSearch(skill, searchLower))
        : false;
      const suggestedByMatch = matchesSearch(project.suggested_by, searchLower);
      const timeMatch = matchesSearch(project.estimatedTimeToComplete, searchLower);
      
      // For description, only search if term is longer than 2 characters to avoid noise
      const descMatch = searchLower.length > 2 ? matchesSearch(project.description, searchLower) : false;
      
      return nameMatch || descMatch || skillsMatch || suggestedByMatch || timeMatch;
    });
  }, [allProjects, debouncedSearchTerm]);

  // Paginate filtered results
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, limit]);

  // Calculate total pages for filtered results
  const calculatedTotalPages = useMemo(() => {
    return Math.ceil(filteredProjects.length / limit) || 1;
  }, [filteredProjects.length, limit]);

  useEffect(() => {
    fetchProjects(1, ''); // Fetch all projects initially, then filter client-side
  }, [fetchProjects]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    // No need to fetch again since we're using client-side filtering
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= calculatedTotalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const openAddModal = () => {
    if (!currentUserCompany) {
      setError("Cannot add project: User company not identified. Please re-login.");
      return;
    }
    setSelectedProject(null);
    setActionError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setActionError(null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (project) => {
    setSelectedProject(project);
    setActionError(null);
    setIsDeleteModalOpen(true);
  };

  const handleAddProject = async (formData) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await axiosInstance.post('/api/projects/add', formData);
      fetchProjects(1, ''); 
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Error adding project:", err);
      setActionError(err.response?.data?.message || 'Failed to add project.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProject = async (formData) => {
    if (!selectedProject || !selectedProject._id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await axiosInstance.put(`/api/projects/update/${selectedProject._id}`, formData);
      fetchProjects(1, ''); // Refresh all projects after update
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating project:", err);
      setActionError(err.response?.data?.message || 'Failed to update project.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject || !selectedProject._id) return;
    setActionLoading(true); // Use actionLoading for the confirmation modal's spinner
    setActionError(null);
    try {
      await axiosInstance.delete(`/api/projects/delete/${selectedProject._id}`);
      fetchProjects(1, ''); // Refresh all projects after delete
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting project:", err);
      // Set error for the delete confirmation modal itself
      setActionError(err.response?.data?.message || 'Failed to delete project.');
      // Do not close modal on error, so user sees the message
    } finally {
      setActionLoading(false); // Stop spinner regardless of success or failure
    }
  };

  // Functions for Approve/Reject
  const openApproveRejectModal = (project, action) => {
    setProjectForApproval(project);
    setApprovalActionType(action); // 'approve' or 'reject'
    setActionError(null); // Clear previous modal errors
    setIsApproveRejectModalOpen(true);
  };

  const handleApproveRejectProject = async () => {
    if (!projectForApproval || !approvalActionType) return;
    setActionLoading(true);
    setActionError(null);
    const newApprovalStatus = approvalActionType === 'approve';
    try {
      await axiosInstance.put(`/api/projects/approve/${projectForApproval._id}`, { isApproved: newApprovalStatus });
      fetchProjects(1, ''); // Refresh all projects after approval/rejection
      setIsApproveRejectModalOpen(false);
    } catch (err) {
      console.error(`Error ${approvalActionType}ing project:`, err);
      setActionError(err.response?.data?.message || `Failed to ${approvalActionType} project.`);
    } finally {
      setActionLoading(false);
    }
  };


  if (loading && !allProjects.length && currentPage === 1 && !isAddModalOpen && !isEditModalOpen && !isDeleteModalOpen && !isApproveRejectModalOpen) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
      </div>
    );
  }

  // Display a general error if company couldn't be identified and is needed for operations
  if (!currentUserCompany && isAddModalOpen) { 
     return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-10 text-red-600 bg-red-100 border border-red-400 rounded-md p-4">
          Could not identify your company. Please try logging in again before adding projects.
        </div>
      </div>
    );
  }

  // Prioritize modal errors over main page error if a modal is open
  const currentMainError = (isAddModalOpen || isEditModalOpen || isDeleteModalOpen || isApproveRejectModalOpen) ? null : error;

  if (currentMainError) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-10 text-red-600 bg-red-100 border border-red-400 rounded-md p-4">{currentMainError}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Manage Projects</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-2/5 lg:w-1/3">
          <input
            type="text"
            placeholder="Search by name, description, skills, time, or suggested by..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {searchTerm && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </form>
        <button
          onClick={openAddModal}
          disabled={!currentUserCompany} // Disable if company not yet loaded
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center transition duration-150 ease-in-out shadow hover:shadow-md w-full md:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <FaPlus className="mr-2" /> Add Project
        </button>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            {filteredProjects.length === 0 
              ? `No projects found for "${searchTerm}"` 
              : `Found ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''} matching "${searchTerm}"`
            }
          </p>
        </div>
      )}

      {loading && allProjects.length > 0 && <div className="text-center py-4 text-gray-500">Updating list...</div>}
      {!loading && paginatedProjects.length === 0 && (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg shadow-inner">
          <FaProjectDiagram size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-semibold mb-2">No projects found.</p>
          {searchTerm && <p className="text-sm">Try adjusting your search term or clear it to see all projects.</p>}
          {!searchTerm && currentUserCompany && <p className="text-sm">Click the "Add Project" button to create your first project.</p>}
          {!searchTerm && !currentUserCompany && <p className="text-sm text-red-500">Company details not loaded. Cannot add projects.</p>}
        </div>
      )}

      {!loading && paginatedProjects.length > 0 && (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills Required</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time to Complete</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggested By</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProjects.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-normal text-sm font-semibold text-gray-900 max-w-xs break-words">{project.name}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-700 max-w-xs break-words">{project.description}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs break-words">
                    {Array.isArray(project.skillRequirement) ? project.skillRequirement.join(', ') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.estimatedTimeToComplete}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.suggested_by || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${project.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {project.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {!project.isApproved && (
                      <>
                        <button 
                          onClick={() => openApproveRejectModal(project, 'approve')} 
                          className="text-green-600 hover:text-green-800 transition-colors" 
                          title="Approve Project"
                        >
                          <FaCheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => openApproveRejectModal(project, 'reject')} 
                          className="text-orange-500 hover:text-orange-700 transition-colors" 
                          title="Reject Project (Mark as Not Approved)"
                        >
                          <FaTimesCircle size={18} />
                        </button>
                      </>
                    )}
                    <button onClick={() => openEditModal(project)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit Project">
                      <FaEdit size={18} />
                    </button>
                    <button onClick={() => openDeleteModal(project)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete Project">
                      <FaTrash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {calculatedTotalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-2">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {[...Array(calculatedTotalPages).keys()].map(num => (
            <button 
              key={num + 1} 
              onClick={() => handlePageChange(num + 1)} 
              className={`px-4 py-2 text-sm font-medium border rounded-md ${currentPage === num + 1 ? 'bg-blue-500 text-white border-blue-500' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}`}
            >
              {num + 1}
            </button>
          ))}
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === calculatedTotalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {isAddModalOpen && (
        <ProjectFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddProject}
          isLoading={actionLoading}
          error={actionError}
          currentUserCompany={currentUserCompany} 
        />
      )}
      {isEditModalOpen && selectedProject && (
        <ProjectFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdateProject}
          project={selectedProject} 
          isLoading={actionLoading}
          error={actionError}
        />
      )}
      {isDeleteModalOpen && selectedProject && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setActionError(null); }} // Clear error on close
          onConfirm={handleDeleteProject}
          title="Delete Project"
          message={`Are you sure you want to delete the project: "${selectedProject.description.substring(0,50)}..."? This action cannot be undone.`}
          confirmText="Delete"
          isLoading={actionLoading} 
          error={actionError} // Display error in modal
        />
      )}
      {/* Approve/Reject Confirmation Modal */}
      {isApproveRejectModalOpen && projectForApproval && (
        <ConfirmationModal
          isOpen={isApproveRejectModalOpen}
          onClose={() => { setIsApproveRejectModalOpen(false); setActionError(null); }}
          onConfirm={handleApproveRejectProject}
          title={`${approvalActionType === 'approve' ? 'Approve' : 'Reject'} Project`}
          message={`Are you sure you want to ${approvalActionType} the project: "${projectForApproval.description.substring(0,50)}..."?`}
          confirmText={approvalActionType === 'approve' ? 'Approve' : 'Reject'}
          confirmButtonColor={approvalActionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          icon={approvalActionType === 'approve' ? FaCheckCircle : FaTimesCircle}
          iconColor={approvalActionType === 'approve' ? 'text-green-500' : 'text-orange-500'}
          isLoading={actionLoading}
          error={actionError}
        />
      )}
    </div>
  );
};

export default ManageProjects;
