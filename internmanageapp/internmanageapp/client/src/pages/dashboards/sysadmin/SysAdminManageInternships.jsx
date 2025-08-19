import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaBriefcase, FaBuilding } from 'react-icons/fa';
import axiosInstance from '../../../utils/axios';
import SysAdminInternshipFormModal from '../../../components/sysadmin/SysAdminInternshipFormModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

const SysAdminManageInternships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInternships = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      // Use the general '/api/internships/all' endpoint for sysadmin
      const response = await axiosInstance.get('/api/internships/all', {
        params: {
          page,
          limit,
          search,
        },
      });
      setInternships(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setCurrentPage(response.data.pagination?.currentPage || 1);
    } catch (err) {
      console.error("Error fetching internships:", err);
      setError(err.response?.data?.message || 'Failed to fetch internships. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchInternships(currentPage, searchTerm);
  }, [fetchInternships, currentPage, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchInternships(1, searchTerm);
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
      await axiosInstance.post('/api/internships/add', formData); // Endpoint might need role check or be specific
      fetchInternships(currentPage, searchTerm);
      setIsAddModalOpen(false);
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
      await axiosInstance.put(`/api/internships/update/${id}`, formData); // Endpoint might need role check or be specific
      fetchInternships(currentPage, searchTerm);
      setIsEditModalOpen(false);
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
      await axiosInstance.delete(`/api/internships/delete/${id}`); // Endpoint might need role check or be specific
      if (internships.length === 1 && currentPage > 1) {
        fetchInternships(currentPage - 1, searchTerm);
      } else {
        fetchInternships(currentPage, searchTerm);
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting internship:", err);
      setActionError(err.response?.data?.message || 'Failed to delete internship.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !internships.length && currentPage === 1) { 
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
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 flex items-center">
        <FaBriefcase className="mr-3 text-blue-600" /> Manage All Internships (System Admin)
      </h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-2/5 lg:w-1/3">
          <input
            type="text"
            placeholder="Search by role, company, location..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </form>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center transition duration-150 ease-in-out shadow hover:shadow-md w-full md:w-auto"
        >
          <FaPlus className="mr-2" /> Add Internship
        </button>
      </div>

      {loading && internships.length > 0 && <div className="text-center py-4 text-gray-500">Updating list...</div>}
      {!loading && internships.length === 0 && (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg shadow-inner">
          <FaBriefcase size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-semibold mb-2">No internships found.</p>
          {searchTerm && <p className="text-sm">Try adjusting your search term or clear it to see all internships.</p>}
          {!searchTerm && <p className="text-sm">Click the "Add Internship" button to post an opportunity.</p>}
        </div>
      )}
      {!loading && internships.length > 0 && (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Role', 'Company', 'Location', 'Type', 'Duration', 'Stipend', 'Openings', 'Posted', 'Actions'].map((header) => (
                  <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {internships.map((internship) => (
                <tr key={internship._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{internship.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{internship.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{internship.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{internship.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{internship.duration}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {internship.stipend && internship.stipend.amount ? 
                      `${internship.stipend.currency} ${internship.stipend.amount.toLocaleString()}` 
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{internship.openings}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(internship.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button onClick={() => openEditModal(internship)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit"><FaEdit size={16} /></button>
                    <button onClick={() => openDeleteModal(internship)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete"><FaTrash size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-700">
            <div className="mb-2 md:mb-0">
                Page {currentPage} of {totalPages} (Showing {internships.length} on this page)
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
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-2 border border-gray-300 font-medium rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-2 border border-gray-300 font-medium rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Last
                </button>
            </div>
        </div>
      )}

      {isAddModalOpen && (
        <SysAdminInternshipFormModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={handleAddInternship} 
          isLoading={actionLoading}
          error={actionError}
        />
      )}
      {isEditModalOpen && selectedInternship && (
        <SysAdminInternshipFormModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={(formData) => handleUpdateInternship(selectedInternship._id, formData)} 
          internship={selectedInternship}
          isLoading={actionLoading}
          error={actionError}
        />
      )}
      {isDeleteModalOpen && selectedInternship && (
        <ConfirmationModal
          title="Confirm Deletion"
          message={`Are you sure you want to delete the internship: "${selectedInternship.role}" from ${selectedInternship.company}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => handleDeleteInternship(selectedInternship._id)}
          onCancel={() => setIsDeleteModalOpen(false)}
          isOpen={isDeleteModalOpen}
          isLoading={actionLoading}
          error={actionError}
        />
      )}
    </div>
  );
};

export default SysAdminManageInternships;
