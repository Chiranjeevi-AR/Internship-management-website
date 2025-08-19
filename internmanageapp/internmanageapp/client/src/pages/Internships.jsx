import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Assuming you use a direct axios import here, or adjust to your axiosInstance if preferred
import axiosInstance from '../utils/axios'; // Use the configured axios instance
import { API_BASE_URL } from '../config/api';
import CompanyCard from '../components/CompanyCard';
import ApplyInternshipModal from '../components/ApplyInternshipModal';
import { getUserPayloadFromToken } from '../utils/authUtils'; // Import the utility

const Internships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    location: '',
    domain: '',
    duration: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalInternships: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 6
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [appliedInternshipIds, setAppliedInternshipIds] = useState(new Set());

  const userType = localStorage.getItem('userType');

  useEffect(() => {
    const fetchInternshipsAndApplications = async () => {
      setLoading(true);
      setError(null);
      let currentUserId = null;

      // Get user ID from token if user is a candidate
      if (userType === 'candidate') {
        const payload = getUserPayloadFromToken();
        if (payload && payload.userId) {
          currentUserId = payload.userId;
        }
      }

      try {
        // Fetch internships
        const queryParams = new URLSearchParams();
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.domain) queryParams.append('domain', filters.domain);
        if (filters.duration) queryParams.append('duration', filters.duration);
        
        const queryString = queryParams.toString();
        const internshipsUrl = `${API_BASE_URL}/api/internships/front-page/${currentPage}${queryString ? `?${queryString}` : ''}`;
        // const internshipsResponse = await axios.get(internshipsUrl);
        const internshipsResponse = await axiosInstance.get(`/api/internships/front-page/${currentPage}${queryString ? `?${queryString}` : ''}`);


        if (internshipsResponse.data.success) {
          setInternships(internshipsResponse.data.data);
          setPagination(internshipsResponse.data.pagination);
        } else {
          setError("Failed to fetch internships");
        }

        // Fetch applied internships for the current candidate
        if (userType === 'candidate' && currentUserId) {
          try {
            // Ensure this endpoint exists and returns an array of internship IDs the user has applied to.
            // Example: { success: true, data: [\'internshipId1\', \'internshipId2\'] }
            // const appliedResponse = await axios.get(`${API_BASE_URL}/api/applications/candidate/${currentUserId}/applied-ids`);
            const appliedResponse = await axiosInstance.get(`/api/applications/candidate/${currentUserId}/applied-ids`);
            if (appliedResponse.data.success && Array.isArray(appliedResponse.data.data)) {
              setAppliedInternshipIds(new Set(appliedResponse.data.data));
            } else {
                setAppliedInternshipIds(new Set());
            }
          } catch (appErr) {
            setAppliedInternshipIds(new Set());
          }
        } else if (userType === 'candidate' && !currentUserId) {
            console.warn('User is candidate but userId could not be extracted from token.');
            setAppliedInternshipIds(new Set());
        }

      } catch (err) {
        setError("An error occurred while fetching data");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInternshipsAndApplications();
  // Removed userId from dependencies as it's derived inside useEffect now.
  // Ensure API_BASE_URL is stable or add if it can change.
  }, [currentPage, filters, userType]); 

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleOpenModal = (internshipId, event) => {
    if (event) {
      event.preventDefault(); 
    }
    setSelectedInternshipId(internshipId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInternshipId(null);
  };

  const handleApplicationSuccess = (applicationData) => {
    // Update UI to reflect that the user has applied to this internship
    if (selectedInternshipId) {
      setAppliedInternshipIds(prev => new Set(prev).add(selectedInternshipId));
    }
    // The modal handles its own success message and closes.
  };

  const filteredInternships = (internships || []).filter(internship => {
    return (
      (internship.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (locationFilter ? internship.location?.toLowerCase().includes(locationFilter.toLowerCase()) : true)
    );
  });

  // When rendering CompanyCard, ensure you are passing the prop correctly
  // This is an example of how it should be used within your map function:
  /*
  {filteredInternships.map((internship) => (
    <CompanyCard 
      key={internship._id} // Make sure to use a key
      internship={internship} // Pass the full internship object directly
      userType={userType}
      onApplyNow={handleOpenModal}
      isApplied={appliedInternshipIds.has(internship._id)} // Crucial part
    />
  ))}
  */

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg">Loading Internships...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500 text-xl">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Available Internships</h1>
      
      {/* Filter Section */}
      <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input 
            type="text"
            placeholder="Search by role, company, or keyword..."
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input 
            type="text"
            placeholder="Filter by location..."
            className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>
      </div>
      
      {/* Internship Listings */}
      {filteredInternships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredInternships.map((internship) => (
            <CompanyCard
              key={internship._id}
              internship={internship} // Pass the full internship object
              userType={userType}
              onApplyNow={handleOpenModal}
              isApplied={appliedInternshipIds.has(internship._id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 text-xl">No internships found matching your criteria.</p>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex justify-center items-center space-x-4">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {isModalOpen && selectedInternshipId && (
        <ApplyInternshipModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          internshipId={selectedInternshipId}
          onSubmitSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};

export default Internships;
