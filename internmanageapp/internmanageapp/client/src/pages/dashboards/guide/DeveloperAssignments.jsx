import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../utils/axios';
import { getTodayLocalDate } from '../../../utils/dateUtils';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaSpinner, FaCalendar, FaUser, FaFileAlt } from 'react-icons/fa';

const DeveloperAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allInterns, setAllInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    projectId: '',
    internId: '',
    file: null
  });
  useEffect(() => {
    fetchData();
  }, []);  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch assignments and user info in parallel
      const [assignmentsResponse, userResponse] = await Promise.all([
        api.get('/api/assignments/developer'),
        api.get('/api/auth/me')
      ]);

      if (assignmentsResponse.data.success) {
        setAssignments(assignmentsResponse.data.data || []);
      } else {
        console.error('Failed to fetch assignments:', assignmentsResponse.data.message);
      }      // Get assigned projects and interns using the user's ID
      if (userResponse.data.success && userResponse.data.user) {
        const userId = userResponse.data.user._id;
        try {
          const projectAssignmentsResponse = await api.get(`/api/project-assignments/developer/${userId}`);
          
          console.log('Project Assignments Response:', projectAssignmentsResponse.data); // Debug log
            if (projectAssignmentsResponse.data.success) {
            // Extract projects and interns from project assignments
            const projectAssignments = projectAssignmentsResponse.data.data || [];
            const projectsList = [];
            const allInternsList = [];
            
            projectAssignments.forEach(assignment => {
              // Only include projects where the user is a mentor (not just panelist)
              const isMentor = assignment.roles?.includes('Mentor');
              
              if (isMentor && assignment.project) {
                // Check if project is already added to avoid duplicates
                const existingProject = projectsList.find(p => p._id === assignment._id);
                if (!existingProject) {
                  projectsList.push({
                    _id: assignment._id, // This is the project assignment ID
                    projectId: assignment.project._id || assignment._id, // Actual project ID for backend
                    name: assignment.project.name,
                    description: assignment.project.description,
                    company: assignment.project.company
                  });
                }
              }
              
              // Add interns with their project info (only for projects where user is a mentor)
              if (isMentor && assignment.assignedInterns) {
                assignment.assignedInterns.forEach(intern => {
                  console.log('Processing intern:', intern); // Debug log
                  if (intern.userId && intern.userId._id) {
                    // Access name and email from the populated userId object
                    const internName = intern.userId.name || intern.userId.email || `Intern ${intern.userId._id.slice(-4)}`;
                    const internEmail = intern.userId.email || 'No email';
                    allInternsList.push({
                      _id: intern.userId._id,
                      name: internName,
                      email: internEmail,
                      projectName: assignment.project?.name || 'Unknown Project',
                      projectId: assignment._id // Use assignment ID for filtering
                    });
                  }
                });
              }
            });
            
            console.log('Extracted Projects:', projectsList); // Debug log
            console.log('Extracted Interns:', allInternsList); // Debug log
            
            setProjects(projectsList);
            setAllInterns(allInternsList);
            setFilteredInterns(allInternsList); // Initially show all interns
          } else {
            console.error('Failed to fetch project assignments:', projectAssignmentsResponse.data.message);
          }
        } catch (internError) {
          console.error('Error fetching assigned projects and interns:', internError);
          // Don't show error for projects/interns as it's not critical for the assignments page
        }
      } else {
        console.error('Failed to get user information');
        toast.error('Failed to get user information');
      }
    } catch (error) {
      console.error('Error fetching assignments data:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Only developers can view assignments.');
      } else {
        toast.error('Failed to fetch assignments data');
      }
    } finally {
      setLoading(false);
    }
  };  const resetForm = () => {
    setFormData({ title: '', description: '', dueDate: '', projectId: '', internId: '', file: null });
    setFilteredInterns(allInterns);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      console.log('File selected:', files[0]);
      console.log('Previous file state:', formData.file);
      setFormData(prev => {
        const newState = { ...prev, file: files[0] };
        console.log('New form state after file selection:', newState);
        return newState;
      });
    } else if (name === 'projectId') {
      // Filter interns based on selected project
      const selectedProjectInterns = allInterns.filter(intern => intern.projectId === value);
      setFilteredInterns(selectedProjectInterns);
      setFormData(prev => ({ ...prev, [name]: value, internId: '' })); // Reset intern selection
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();    if (!formData.title || !formData.description || !formData.dueDate || !formData.projectId || !formData.internId) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate that due date is not before today (using local time)
    const todayStr = getTodayLocalDate();
    if (formData.dueDate < todayStr) {
      toast.error('Due date cannot be before today. Please select today or a future date.');
      return;
    }

    // File upload is now optional for both creating and editing assignments

    try {
      // Find the selected project to get the actual project ID
      const selectedProject = projects.find(p => p._id === formData.projectId);
      const actualProjectId = selectedProject?.projectId || formData.projectId;
      
      console.log('Selected project:', selectedProject);
      console.log('Actual project ID:', actualProjectId);
      console.log('Form project ID:', formData.projectId);
      
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('dueDate', formData.dueDate);
      submitData.append('projectId', actualProjectId); // Use actual project ID
      submitData.append('internId', formData.internId); // Backend maps this to assignedTo
      
      if (formData.file) {
        submitData.append('assignment', formData.file); // Backend expects 'assignment' field name
      }

      if (editingAssignment) {
        const response = await api.put(`/api/assignments/${editingAssignment._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
          toast.success('Assignment updated successfully');
        }      } else {
        console.log('Creating assignment with data:', {
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate,
          projectId: actualProjectId,
          internId: formData.internId,
          hasFile: !!formData.file
        }); // Debug log
        
        const response = await api.post('/api/assignments', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
          toast.success('Assignment created successfully');        }
      }

      setShowModal(false);
      setEditingAssignment(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving assignment:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to save assignment';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (assignment) => {    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
      projectId: assignment.projectId?._id || '',
      internId: assignment.assignedTo?._id || assignment.internId?._id || '',
      file: null
    });
    
    // Filter interns for the selected project
    if (assignment.projectId?._id) {
      const selectedProjectInterns = allInterns.filter(intern => intern.projectId === assignment.projectId._id);
      setFilteredInterns(selectedProjectInterns);
    }
    
    setShowModal(true);
  };

  const handleDelete = (assignmentId) => {
    setAssignmentToDelete(assignmentId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      const response = await api.delete(`/api/assignments/${assignmentToDelete}`);
      if (response.data.success) {
        toast.success('Assignment deleted successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    } finally {
      setShowDeleteConfirm(false);
      setAssignmentToDelete(null);
    }
  };

  const handleDownload = async (assignmentId, fileName, type = 'assignment') => {
    try {
      const url = type === 'submission' 
        ? `/api/assignments/download/${assignmentId}?type=submission`
        : `/api/assignments/download/${assignmentId}`;
        
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName || 'file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-blue-600">
          <FaSpinner className="animate-spin text-xl" />
          <span className="text-lg">Loading assignments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg p-6">        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Manage Assignments</h1>
            <p className="text-sm text-gray-600 mt-1">
              Projects where you're a mentor: {projects.length} | Total interns: {allInterns.length}
            </p>
          </div>          <button
            onClick={() => {
              if (projects.length === 0) {
                toast.error('No projects available. You need to be assigned as a mentor to a project first.');
                return;
              }
              setEditingAssignment(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            disabled={projects.length === 0}
          >
            <FaPlus className="mr-2" />
            Create Assignment
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <FaFileAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Assignments Yet</h3>
            <p className="text-gray-500 mb-4">Create your first assignment to get started.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Create Assignment
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {assignments.map((assignment) => (
              <div key={assignment._id} className="bg-gray-50 rounded-lg p-6 border">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{assignment.title}</h3>
                    <p className="text-gray-600 mb-3">{assignment.description}</p>                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaUser className="mr-1" />
                        <span>{assignment.assignedTo?.name || assignment.internId?.name || 'Unknown Intern'}</span>
                      </div>
                      <div className="flex items-center">
                        <FaCalendar className="mr-1" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      {assignment.projectId && (
                        <div className="flex items-center">
                          <FaFileAlt className="mr-1" />
                          <span>Project: {assignment.projectId?.name || 'Unknown Project'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(assignment)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded transition-colors"
                      title="Edit Assignment"
                    >
                      <FaEdit />
                    </button>
                    {assignment.fileUrl && (
                      <button
                        onClick={() => handleDownload(assignment._id, assignment.fileName)}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"
                        title="Download Assignment"
                      >
                        <FaDownload />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(assignment._id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                      title="Delete Assignment"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                {assignment.status && (
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.status === 'pending' ? 'Pending' : 
                       assignment.status === 'submitted' ? 
                       (assignment.submission?.submittedLate ? 'Submitted Late' : 'Submitted') :
                       assignment.status === 'reviewed' ? 'Reviewed' : assignment.status}
                    </span>
                  </div>
                )}

                {/* Show submission details if assignment is submitted */}
                {assignment.submission && (assignment.status === 'submitted' || assignment.status === 'reviewed') && (
                  <div className="mt-4 border-t pt-4 bg-blue-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-700 mb-2">Intern Submission:</h4>
                    {assignment.submission.replyText && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600 font-medium">Reply:</p>
                        <p className="text-sm text-gray-700">{assignment.submission.replyText}</p>
                      </div>
                    )}
                    {assignment.submission.fileName && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600 font-medium">Submitted File:</p>
                        <button
                          onClick={() => handleDownload(assignment._id, assignment.submission.fileName, 'submission')}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          📎 {assignment.submission.fileName}
                        </button>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Submitted on: {new Date(assignment.submission.submittedAt).toLocaleString()}
                      {assignment.submission.submittedLate && (
                        <span className="text-red-500 ml-2">(Late submission)</span>
                      )}
                    </div>
                    {assignment.submission.feedback && (
                      <div className="mt-2 border-t pt-2">
                        <p className="text-sm text-gray-600 font-medium">Your Feedback:</p>
                        <p className="text-sm text-gray-700">{assignment.submission.feedback}</p>
                        {assignment.submission.grade && (
                          <p className="text-xs text-gray-500 mt-1">Grade: {assignment.submission.grade}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4">
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Project *
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name} - {project.company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Intern *
                </label>
                <select
                  name="internId"
                  value={formData.internId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.projectId}
                >
                  <option value="">
                    {!formData.projectId ? 'Select a project first' : 'Select an intern'}
                  </option>
                  {filteredInterns.map((intern) => {
                    const displayName = intern.name || intern.email || `Intern ${intern._id?.slice(-4) || 'Unknown'}`;
                    const displayEmail = intern.email || 'No email';
                    return (
                      <option key={intern._id} value={intern._id}>
                        {displayName} ({displayEmail})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  min={new Date().toLocaleDateString('en-CA')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment File (PDF, DOC, DOCX)
                </label>
                <input
                  type="file"
                  name="file"
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx"
                />
                {formData.file && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {formData.file.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAssignment(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAssignment ? 'Update' : 'Create'} Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <FaTrash className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Delete Assignment
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this assignment? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setAssignmentToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperAssignments;
