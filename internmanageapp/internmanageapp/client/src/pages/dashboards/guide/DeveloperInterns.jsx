import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../utils/axios';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaBuilding, FaSpinner, FaEye, FaUserGraduate, FaProjectDiagram } from 'react-icons/fa';

const DeveloperInterns = () => {
  const [assignedInterns, setAssignedInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAssignedInterns();
  }, []);
  const fetchAssignedInterns = async () => {
    try {
      setLoading(true);
      
      const userResponse = await api.get('/api/auth/me');
      if (!userResponse.data.success || !userResponse.data.user) {
        toast.error('Failed to get user information');
        return;
      }
      
      const userId = userResponse.data.user._id;
      const response = await api.get(`/api/project-assignments/developer/${userId}`);
      
      if (response.data.success) {
        const projectAssignments = response.data.data || [];
        const internsMap = new Map();

        projectAssignments.forEach(assignment => {
          const projectName = assignment.projectId?.name || 'Unknown Project';
          if (assignment.assignedInterns) {
            assignment.assignedInterns.forEach(intern => {
              if (intern.userId && intern.userId._id) {
                const internId = intern.userId._id;
                if (!internsMap.has(internId)) {
                  internsMap.set(internId, {
                    ...intern.userId,
                    projectNames: [],
                  
                    assignmentStatus: intern.status || 'active' 
                  });
                }
                internsMap.get(internId).projectNames.push(projectName);
              }
            });
          }
        });

        const allInterns = Array.from(internsMap.values());
        setAssignedInterns(allInterns);
      }
    } catch (error) {
      toast.error('Failed to fetch assigned interns');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (intern) => {
    try {
      const response = await api.get(`/api/users/${intern._id}`);
      if (response.data.success) {
        setSelectedIntern(response.data.user);
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Failed to fetch intern details');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-blue-600">
          <FaSpinner className="animate-spin text-xl" />
          <span className="text-lg">Loading assigned interns...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Assigned Interns</h1>
          <div className="text-sm text-gray-600">
            Total Interns: {assignedInterns.length}
          </div>
        </div>

        {assignedInterns.length === 0 ? (
          <div className="text-center py-12">
            <FaUserGraduate className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Assigned Interns</h3>
            <p className="text-gray-500">You don't have any interns assigned to your projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedInterns.map((intern) => (
              <div key={intern._id} className="bg-gray-50 rounded-lg p-6 border hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <FaUser className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{intern.name}</h3>
                    <p className="text-sm text-gray-600">{intern.email}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {intern.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FaPhone className="mr-2 text-gray-400" />
                      <span>{intern.phone}</span>
                    </div>
                  )}
                  
                  {intern.company && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FaBuilding className="mr-2 text-gray-400" />
                      <span>{intern.company}</span>
                    </div>
                  )}

                  {intern.projects && intern.projects.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FaProjectDiagram className="mr-2 text-gray-400" />
                      <span>{intern.projects.length} Project(s)</span>
                    </div>
                  )}

                  {intern.joiningDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FaCalendar className="mr-2 text-gray-400" />
                      <span>Joined: {new Date(intern.joiningDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(intern.status || 'active')}`}>
                    {(intern.status || 'active').toUpperCase()
                    }
                  </span>
                  
                  <button
                    onClick={() => handleViewDetails(intern)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors flex items-center text-sm"
                  >
                    <FaEye className="mr-1" />
                    View Details
                  </button>
                </div>

                {/* Show assigned projects */}
                {intern.projectNames && intern.projectNames.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Projects:</h4>
                    <div className="space-y-1">
                      {intern.projectNames.slice(0, 2).map((projectName, index) => (
                        <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {projectName}
                        </div>
                      ))}
                      {intern.projectNames.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{intern.projectNames.length - 2} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intern Details Modal */}
      {showModal && selectedIntern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Intern Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedIntern(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-800">{selectedIntern.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-800">{selectedIntern.email}</p>
                </div>

                {selectedIntern.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-800">{selectedIntern.phone}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600">Role</label>
                  <p className="text-gray-800 capitalize">{selectedIntern.role}</p>
                </div>

                {selectedIntern.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Company</label>
                    <p className="text-gray-800">{selectedIntern.company}</p>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Information</h3>
                
                {selectedIntern.isVerified !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Verification Status</label>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      selectedIntern.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedIntern.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                )}

                {selectedIntern.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Joined Date</label>
                    <p className="text-gray-800">{new Date(selectedIntern.createdAt).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedIntern.lastLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Last Login</label>
                    <p className="text-gray-800">{new Date(selectedIntern.lastLogin).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedIntern.skills && selectedIntern.skills.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Skills</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIntern.skills.map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Projects Section */}
            {selectedIntern.projects && selectedIntern.projects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Assigned Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedIntern.projects.map((project, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800">{project.title || `Project ${index + 1}`}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      )}
                      {project.status && (
                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedIntern(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperInterns;
