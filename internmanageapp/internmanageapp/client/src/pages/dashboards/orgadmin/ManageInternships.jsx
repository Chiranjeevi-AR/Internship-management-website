import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaBriefcase, FaTimes } from 'react-icons/fa';
import axiosInstance from '../../../utils/axios';
import InternshipFormModal from '../../../components/orgadmin/InternshipFormModal'; // Uncommented
import ConfirmationModal from '../../../components/common/ConfirmationModal'; // Uncommented
// import { useAuth } from '../../../context/AuthContext'; // Assuming you have an AuthContext to get currentUser

const ManageInternships = () => {
  const [internships, setInternships] = useState([]);
  const [allInternships, setAllInternships] = useState([]); // Store all internships for client-side filtering
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
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [actionError, setActionError] = useState(null); // For errors in add/edit/delete
  const [actionLoading, setActionLoading] = useState(false); // For loading state during add/edit/delete

  // const { user: currentUser } = useAuth(); // Get currentUser from context if available

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

  const fetchInternships = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/api/internships/organization/my-internships', {
        params: {
          page,
          limit: 1000, // Fetch all internships for client-side filtering
          // Remove search parameter to get all data
        },
      });
      const fetchedInternships = response.data.data || [];
      setInternships(fetchedInternships);
      setAllInternships(fetchedInternships); // Store all internships for client-side filtering
      setTotalPages(response.data.pagination?.totalPages || 1);
      setCurrentPage(response.data.pagination?.currentPage || 1);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching internships:", err);
      setError(err.response?.data?.message || 'Failed to fetch internships. Please try again.');
      setLoading(false);
    }
  }, []);

  // Client-side filtering for better search experience
  const filteredInternships = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return allInternships;
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

    return allInternships.filter(internship => {
      const roleMatch = matchesSearch(internship.role, searchLower);
      const locationMatch = matchesSearch(internship.location, searchLower);
      const typeMatch = matchesSearch(internship.type, searchLower);
      const skillsMatch = Array.isArray(internship.skills) 
        ? internship.skills.some(skill => matchesSearch(skill, searchLower))
        : false;
      const companyMatch = matchesSearch(internship.company, searchLower);
      
      // For job description, only search if term is longer than 2 characters to avoid noise
      const descMatch = searchLower.length > 2 ? matchesSearch(internship.jobDescription, searchLower) : false;
      const eligibilityMatch = searchLower.length > 2 ? matchesSearch(internship.eligibility, searchLower) : false;
      
      return roleMatch || locationMatch || typeMatch || skillsMatch || companyMatch || descMatch || eligibilityMatch;
    });
  }, [allInternships, debouncedSearchTerm]);

  // Paginate filtered results
  const paginatedInternships = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredInternships.slice(startIndex, endIndex);
  }, [filteredInternships, currentPage, limit]);

  // Update total pages based on filtered results
  const calculatedTotalPages = useMemo(() => {
    return Math.ceil(filteredInternships.length / limit);
  }, [filteredInternships.length, limit]);

  useEffect(() => {
    setTotalPages(calculatedTotalPages);
    // Reset to page 1 if current page exceeds total pages after filtering
    if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [calculatedTotalPages, currentPage]);

  useEffect(() => {
    fetchInternships(); // Fetch all data initially, then filter client-side
  }, [fetchInternships]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    // Search is handled by debounced search term, no need to do anything
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const openAddModal = () => {
    setSelectedInternship(null);
    setActionError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (internship) => {
    setSelectedInternship(internship);
    setActionError(null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (internship) => {
    setSelectedInternship(internship);
    setActionError(null);
    setIsDeleteModalOpen(true);
  };

  const handleAddInternship = async (formData) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await axiosInstance.post('/api/internships/add', formData);
      fetchInternships(); // Refresh list and get all data
      setIsAddModalOpen(false);
      // TODO: Add success notification/toast
    } catch (err) {
      console.error("Error adding internship:", err);
      setActionError(err.response?.data?.message || 'Failed to add internship.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateInternship = async (id, formData) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await axiosInstance.put(`/api/internships/update/${id}`, formData);
      fetchInternships(); // Refresh list and get all data
      setIsEditModalOpen(false);
      // TODO: Add success notification/toast
    } catch (err) {
      console.error("Error updating internship:", err);
      setActionError(err.response?.data?.message || 'Failed to update internship.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInternship = async (id) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await axiosInstance.delete(`/api/internships/delete/${id}`);
      // If current page becomes empty after deletion, go to previous page or first page
      const remainingItems = filteredInternships.length - 1;
      const newTotalPages = Math.ceil(remainingItems / limit);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      fetchInternships(); // Refresh list and get all data
      setIsDeleteModalOpen(false);
      // TODO: Add success notification/toast
    } catch (err) {
      console.error("Error deleting internship:", err);
      setActionError(err.response?.data?.message || 'Failed to delete internship.');
      // Keep delete modal open if there's an error so user can see it
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !allInternships.length) { 
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-10 text-red-600 bg-red-100 border border-red-400 rounded-md p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Manage Your Internships</h1>

      {/* Search and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-2/5 lg:w-1/3">
          <input
            type="text"
            placeholder="Search by role, location, skills, type..."
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center transition duration-150 ease-in-out shadow hover:shadow-md w-full md:w-auto"
        >
          <FaPlus className="mr-2" /> Add Internship
        </button>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            {filteredInternships.length === 0 
              ? `No internships found for "${searchTerm}"` 
              : `Found ${filteredInternships.length} internship${filteredInternships.length !== 1 ? 's' : ''} matching "${searchTerm}"`
            }
          </p>
        </div>
      )}

      {/* Internships Table */}
      {loading && allInternships.length > 0 && <div className="text-center py-4 text-gray-500">Updating list...</div>}
      {!loading && filteredInternships.length === 0 && (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg shadow-inner">
          <FaBriefcase size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-semibold mb-2">
            {searchTerm ? 'No internships match your search.' : 'No internships found.'}
          </p>
          {searchTerm && (
            <div className="space-y-2">
              <p className="text-sm">Try adjusting your search term or clear it to see all internships.</p>
              <button
                onClick={handleSearchClear}
                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          )}
          {!searchTerm && <p className="text-sm">Click the "Add Internship" button to post your first opportunity.</p>}
        </div>
      )}
      {!loading && paginatedInternships.length > 0 && (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Role', 'Location', 'Type', 'Start Date', 'End Date', 'Stipend', 'Openings', 'Posted', 'Actions'].map((header) => (
                  <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedInternships.map((internship) => {
                const stipendDisplay = internship.stipend?.amount
                  ? `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: internship.stipend.currency, minimumFractionDigits: 0 }).format(internship.stipend.amount)}`
                  : 'N/A';

                return (
                  <tr key={internship._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{internship.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{internship.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{internship.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(internship.internshipStartDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(internship.internshipEndDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{stipendDisplay}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{internship.openings}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(internship.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(internship)} className="text-blue-600 hover:text-blue-900 mr-4 transition duration-150 ease-in-out"><FaEdit /></button>
                      <button onClick={() => openDeleteModal(internship)} className="text-red-600 hover:text-red-900 transition duration-150 ease-in-out"><FaTrash /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {calculatedTotalPages > 1 && (
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-700">
            <div className="mb-2 md:mb-0">
                Page {currentPage} of {calculatedTotalPages} 
                {searchTerm && (
                  <span className="text-gray-500">
                    {' '}(Showing {filteredInternships.length} of {allInternships.length} total)
                  </span>
                )}
                {!searchTerm && (
                  <span className="text-gray-500">
                    {' '}(Showing {paginatedInternships.length} on this page)
                  </span>
                )}
            </div>
            <div className="flex space-x-1.5">
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-2 border border-gray-300 font-medium rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    First
                </button>
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-2 border border-gray-300 font-medium rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>
                <span className="px-3 py-2 border border-gray-300 font-medium rounded-md bg-gray-100">{currentPage}</span> 
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === calculatedTotalPages || loading}
                    className="px-3 py-2 border border-gray-300 font-medium rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
                <button
                    onClick={() => handlePageChange(calculatedTotalPages)}
                    disabled={currentPage === calculatedTotalPages || loading}
                    className="px-3 py-2 border border-gray-300 font-medium rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Last
                </button>
            </div>
        </div>
      )}

      {/* Render Modals */}
      {isAddModalOpen && (
        <InternshipFormModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={handleAddInternship} 
          // companyName={currentUser?.companyName} // Pass companyName if available from auth context
          isLoading={actionLoading}
          error={actionError}
        />
      )}
      {isEditModalOpen && selectedInternship && (
        <InternshipFormModal 
          isOpen={isEditModalOpen} 
          internship={selectedInternship} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={(formData) => handleUpdateInternship(selectedInternship._id, formData)} 
          // companyName={currentUser?.companyName} // Pass companyName if available from auth context
          isLoading={actionLoading}
          error={actionError}
        />
      )}
      {isDeleteModalOpen && selectedInternship && (
        <ConfirmationModal
          title="Confirm Deletion"
          message={`Are you sure you want to delete the internship: "${selectedInternship.role}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => handleDeleteInternship(selectedInternship._id)}
          onCancel={() => setIsDeleteModalOpen(false)}
          isOpen={isDeleteModalOpen}
          isLoading={actionLoading}
          error={actionError} // Show error within the confirmation modal if delete fails
        />
      )}
    </div>
  );
};

export default ManageInternships;
