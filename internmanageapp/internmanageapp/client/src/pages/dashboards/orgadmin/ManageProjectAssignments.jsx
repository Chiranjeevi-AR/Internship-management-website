import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../../../utils/axios'; // Ensure this path is correct
import { toast } from 'react-toastify';
import { FaUserPlus, FaUserGraduate, FaCode, FaComments } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ManageProjectAssignments = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignmentsAndVolunteers, setAssignmentsAndVolunteers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: '', project: null, userType: '' }); // type: 'viewAssigned', 'assignUser'
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  
  // State for the assignment form within the modal
  const [selectedUserToAssignInModal, setSelectedUserToAssignInModal] = useState('');
  const [selectedUserTypeToAssignInModal, setSelectedUserTypeToAssignInModal] = useState('');

  // State for Panelist Modal
  const [isPanelistModalOpen, setIsPanelistModalOpen] = useState(false);
  const [currentProjectForPanelistModal, setCurrentProjectForPanelistModal] = useState(null);
  const [selectedDeveloperForPanelistRole, setSelectedDeveloperForPanelistRole] = useState('');
  const [panelistAssignSearchTerm, setPanelistAssignSearchTerm] = useState('');
  const [panelistVolunteerSearchTerm, setPanelistVolunteerSearchTerm] = useState('');
  const [volunteerPanelistsForProject, setVolunteerPanelistsForProject] = useState([]);

  // State for View Panelists Modal
  const [isViewPanelistsModalOpen, setIsViewPanelistsModalOpen] = useState(false);
  const [currentProjectForViewPanelistsModal, setCurrentProjectForViewPanelistsModal] = useState(null);
  const [viewPanelistsSearchTerm, setViewPanelistsSearchTerm] = useState('');

  // State for Notify Members Modal
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [currentProjectForNotifyModal, setCurrentProjectForNotifyModal] = useState(null); // Can be null if it's a universal notification
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [isUniversalNotifyModalOpen, setIsUniversalNotifyModalOpen] = useState(false);
  const [universalNotifySubject, setUniversalNotifySubject] = useState('Important Update for All Projects');
  const [universalNotifyMessage, setUniversalNotifyMessage] = useState('');
  const [lastUniversalNotificationTime, setLastUniversalNotificationTime] = useState(null); // Added state for last notification time

  const API_URLS = {
    fetchProjects: '/api/projects/all',
    fetchUsers: '/api/auth/company-assignable-users',
    fetchAllProjectAssignments: '/api/project-assignments/all',
    assignUserToProject: '/api/project-assignments/assign-user',
    removeUserFromProject: '/api/project-assignments/remove-user',
    reviewVolunteerRequest: '/api/project-assignments/review-volunteer',
    initializeProjectAssignment: '/api/project-assignments/initialize', // Added for initializing project assignments
    // Panelist specific API URLs
    assignPanelist: '/api/project-assignments/panelist/assign',
    reviewPanelistVolunteer: '/api/project-assignments/panelist/review-volunteer',
    assignRandomPanelist: '/api/project-assignments/panelist/assign-random',
    removePanelistFromProject: '/api/project-assignments/panelist/remove', // Added for removing panelists
    notifyProjectMembers: '/api/project-assignments/notify-members', // Added for manual notification
    notifyAllProjectsMembers: '/api/project-assignments/notify-all-projects-members',
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projectsRes, usersRes, assignmentsRes] = await Promise.all([
        axios.get(API_URLS.fetchProjects),
        axios.get(API_URLS.fetchUsers),
        axios.get(API_URLS.fetchAllProjectAssignments)
      ]);

      if (projectsRes.data && projectsRes.data.success) {
        setProjects(projectsRes.data.data || []);
      } else {
        console.error("ManageProjectAssignments: Failed to fetch projects - API success false or no data property.", projectsRes.data?.message);
        throw new Error(projectsRes.data?.message || 'Failed to fetch projects.');
      }

      if (usersRes.data && usersRes.data.success) {
        setUsers(usersRes.data.data || []);
      } else {
        console.error("ManageProjectAssignments: Failed to fetch users - API success false or no data property.", usersRes.data?.message);
        throw new Error(usersRes.data?.message || 'Failed to fetch users.');
      }

      if (assignmentsRes.data && assignmentsRes.data.success) {
        const assignmentsData = assignmentsRes.data.data || [];
        const processedData = {};
        assignmentsData.forEach(assignment => {
          const projectId = assignment.projectId?._id || assignment.projectId;
          if (projectId) {
            processedData[projectId] = {
              assignmentId: assignment._id,
              assignedDevelopers: assignment.assignedDevelopers || [],
              assignedInterns: assignment.assignedInterns || [],
              pendingVolunteerDevelopers: (assignment.volunteerDevelopers || []).filter(v => v.status === 'pending'),
              pendingVolunteerInterns: (assignment.volunteerInterns || []).filter(v => v.status === 'pending'),
              // Add panelist data from assignment if available in the response
              panelists: assignment.panelists || [],
              pendingVolunteerPanelists: (assignment.volunteerPanelists || []).filter(v => v.status === 'pending'),
            };
          } else {
            console.warn("ManageProjectAssignments: Found assignment with no projectId:", assignment);
          }
        });
        setAssignmentsAndVolunteers(processedData);
      } else {
        console.error("ManageProjectAssignments: Failed to fetch project assignments - API success false or no data property.", assignmentsRes.data?.message);
        throw new Error(assignmentsRes.data?.message || 'Failed to fetch project assignments.');
      }

    } catch (err) {
      console.error("ManageProjectAssignments: Error fetching initial data:", err.response || err.message || err);
      const errorMessage = err.response?.data?.message || err.message || 'Could not load data. Check console for more details.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
    setIsLoading(false);
  }, [API_URLS.fetchProjects, API_URLS.fetchUsers, API_URLS.fetchAllProjectAssignments]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshProjectData = useCallback(async () => {
    setIsLoading(true);
    try {
        const assignmentsResponse = await axios.get(API_URLS.fetchAllProjectAssignments);
        if (assignmentsResponse.data && assignmentsResponse.data.success) {
            const assignmentsData = assignmentsResponse.data.data || [];
            const processedData = {};
            assignmentsData.forEach(assignment => {
                const projectId = assignment.projectId?._id || assignment.projectId;
                if (projectId) {
                    processedData[projectId] = {
                        assignmentId: assignment._id,
                        assignedDevelopers: assignment.assignedDevelopers || [],
                        assignedInterns: assignment.assignedInterns || [],
                        pendingVolunteerDevelopers: (assignment.volunteerDevelopers || []).filter(v => v.status === 'pending'),
                        pendingVolunteerInterns: (assignment.volunteerInterns || []).filter(v => v.status === 'pending'),
                         // Add panelist data from assignment if available in the response
                        panelists: assignment.panelists || [],
                        pendingVolunteerPanelists: (assignment.volunteerPanelists || []).filter(v => v.status === 'pending'),
                    };
                }
            });
            setAssignmentsAndVolunteers(processedData);
            toast.info("Assignment data refreshed.");
        } else {
            throw new Error(assignmentsResponse.data.message || 'Failed to refresh project assignments.');
        }
    } catch (err) {
        console.error("ManageProjectAssignments: Error refreshing assignments:", err.response || err.message);
        toast.error(err.response?.data?.message || err.message || 'Could not refresh assignments.');
    }
    setIsLoading(false);
  }, [API_URLS.fetchAllProjectAssignments]);

  const openModal = (type, project, userType = '') => {
    setModalConfig({ type, project, userType });
    setSelectedUserToAssignInModal(''); // Reset selection
    setSelectedUserTypeToAssignInModal(userType); // Pre-fill if assignIntern/Developer
    setModalSearchTerm(''); // Reset search term on modal open
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalConfig({ type: '', project: null, userType: '' });
    setModalSearchTerm(''); // Reset search term on modal close
  };

  const openPanelistModal = (project) => {
    setCurrentProjectForPanelistModal(project);
    setSelectedDeveloperForPanelistRole('');
    setPanelistAssignSearchTerm('');
    setPanelistVolunteerSearchTerm('');
    
    const projectData = assignmentsAndVolunteers[project._id];
    if (projectData && projectData.pendingVolunteerPanelists) {
        setVolunteerPanelistsForProject(projectData.pendingVolunteerPanelists);
    } else {
        setVolunteerPanelistsForProject([]);
        // console.log("No pre-loaded volunteer panelists for project:", project._id, "Consider fetching if needed.");
    }

    setIsPanelistModalOpen(true);
  };

  const closePanelistModal = () => {
    setIsPanelistModalOpen(false);
    setCurrentProjectForPanelistModal(null);
    setSelectedDeveloperForPanelistRole('');
    setPanelistAssignSearchTerm('');
    setPanelistVolunteerSearchTerm('');
    setVolunteerPanelistsForProject([]);
  };

  const openViewPanelistsModal = (project) => {
    // console.log("Opening view panelists modal for project:", project);
    setCurrentProjectForViewPanelistsModal(project);
    setViewPanelistsSearchTerm('');
    setIsViewPanelistsModalOpen(true);
  };

  const closeViewPanelistsModal = () => {
    setIsViewPanelistsModalOpen(false);
    setCurrentProjectForViewPanelistsModal(null);
    setViewPanelistsSearchTerm('');
  };

  const openNotifyModal = (project) => {
    setCurrentProjectForNotifyModal(project);
    setNotifySubject(project ? `Update for project: ${project.name}` : 'General Project Update'); // Pre-fill subject
    setNotifyMessage(''); // Clear message
    setIsNotifyModalOpen(true);
  };

  const closeNotifyModal = () => {
    setIsNotifyModalOpen(false);
    setCurrentProjectForNotifyModal(null);
    setNotifySubject('');
    setNotifyMessage('');
  };

  const openUniversalNotifyModal = () => {
    // Check local storage for the last notification time
    const lastSentTime = localStorage.getItem('lastUniversalNotificationTime');
    if (lastSentTime) {
      setLastUniversalNotificationTime(new Date(parseInt(lastSentTime)).toLocaleString());
    } else {
      setLastUniversalNotificationTime(null);
    }
    setIsUniversalNotifyModalOpen(true);
  };

  const closeUniversalNotifyModal = () => {
    setIsUniversalNotifyModalOpen(false);
    // No longer need to reset subject/message here
    // setLastUniversalNotificationTime(null); // Optionally reset this if you only want to show it once per open
  };

  const handleSendUniversalNotification = async () => {
    // Removed subject and message validation as they are no longer sent from frontend
    setIsLoading(true);
    try {
      // The request body is now empty or ignored by the backend for this specific endpoint
      const response = await axios.post(API_URLS.notifyAllProjectsMembers, {}); 
      if (response.data.success) {
        toast.success(response.data.message || 'Universal notifications sent successfully!');
        // Store the current time in local storage
        localStorage.setItem('lastUniversalNotificationTime', Date.now().toString());
        closeUniversalNotifyModal();
      } else {
        // Handle cases where the API might return success: false but with a message (e.g., 207 Multi-Status)
        if (response.status === 207 && response.data.details) {
            toast.warn(`${response.data.message} Sent: ${response.data.details.sent}/${response.data.details.attempted}. Check console for errors.`);
            console.warn("Universal Notification Partial Success:", response.data.details.errors);
            // Store the current time in local storage even on partial success
            localStorage.setItem('lastUniversalNotificationTime', Date.now().toString());
            closeUniversalNotifyModal();
        } else {
            throw new Error(response.data.message || 'Failed to send universal notifications.');
        }
      }
    } catch (err) {
      console.error("Error sending universal notifications:", err.response || err.message);
      const errorMsg = err.response?.data?.message || err.message || 'Could not send universal notifications.';
      if (err.response?.data?.details?.errors) {
        console.error("Detailed errors from backend:", err.response.data.details.errors);
        toast.error(`${errorMsg} Some emails may have failed. Check console.`);
      } else {
        toast.error(errorMsg);
      }
    }
    setIsLoading(false);
  };

  const handleSendNotification = async () => {
    if (!currentProjectForNotifyModal?._id || !notifyMessage.trim()) {
      toast.warn('Project information is missing or message is empty.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(API_URLS.notifyProjectMembers, {
        projectId: currentProjectForNotifyModal._id,
        subject: notifySubject.trim(),
        message: notifyMessage.trim(),
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Notifications sent successfully!');
        closeNotifyModal();
      } else {
        throw new Error(response.data.message || 'Failed to send notifications.');
      }
    } catch (err) {
      console.error("Error sending notifications:", err.response || err.message);
      toast.error(err.response?.data?.message || err.message || 'Could not send notifications.');
    }
    setIsLoading(false);
  };

  const handleAssignDeveloperAsPanelist = async () => {
    if (!selectedDeveloperForPanelistRole || !currentProjectForPanelistModal?._id) {
      toast.warn('Please select a developer and ensure project is selected.');
      return;
    }
    setIsLoading(true);
    // console.log(`Assigning ${selectedDeveloperForPanelistRole} as panelist to project ${currentProjectForPanelistModal.name}`);
    try {
      const response = await axios.post(API_URLS.assignPanelist, { 
        projectId: currentProjectForPanelistModal._id, 
        userId: selectedDeveloperForPanelistRole 
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Panelist allocated successfully!');
        refreshProjectData(); 
        setSelectedDeveloperForPanelistRole('');
      } else {
        throw new Error(response.data.message || 'Failed to assign panelist.');
      }
    } catch (err) {
      console.error("Error assigning panelist:", err.response || err.message);
      toast.error(err.response?.data?.message || err.message || 'Could not assign panelist.');
    }
    setIsLoading(false);
  };

  const handleReviewVolunteerPanelist = async (volunteerUserId, status) => {
    const projectData = assignmentsAndVolunteers[currentProjectForPanelistModal?._id];
    if (!currentProjectForPanelistModal?._id || !volunteerUserId || !projectData?.assignmentId) {
        toast.warn('Project, volunteer, or assignment information missing.');
        return;
    }
    setIsLoading(true);
    // console.log(`Reviewing volunteer panelist ${volunteerUserId} for project ${currentProjectForPanelistModal.name} with status ${status}`);
    try {
      const response = await axios.put(API_URLS.reviewPanelistVolunteer, {
        assignmentId: projectData.assignmentId,
        userId: volunteerUserId,
        status
      });
      if (response.data.success) {
        toast.success(response.data.message || `Panelist volunteer request ${status} successfully!`);
        refreshProjectData();
      } else {
        throw new Error(response.data.message || 'Failed to review volunteer panelist.');
      }
    } catch (err) {
      console.error(`Error reviewing panelist volunteer ${status}:`, err.response || err.message);
      toast.error(err.response?.data?.message || err.message || `Could not review volunteer panelist.`);
    }
    setIsLoading(false);
  };
  
  const handleAssignRandomPanelist = async () => {
    if (!currentProjectForPanelistModal?._id) {
        toast.warn('Project information missing.');
        return;
    }
    setIsLoading(true);
    // console.log(`Assigning random panelist to project ${currentProjectForPanelistModal.name}`);
    try {
      const response = await axios.post(API_URLS.assignRandomPanelist, { 
        projectId: currentProjectForPanelistModal._id 
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Random panelist allocated successfully!');
        refreshProjectData();
      } else {
        throw new Error(response.data.message || 'Failed to assign random panelist.');
      }
    } catch (err) {
      console.error("Error assigning random panelist:", err.response || err.message);
      toast.error(err.response?.data?.message || err.message || 'Could not assign random panelist.');
    }
    setIsLoading(false);
  };

  const handleRemovePanelistFromProject = async (projectId, panelistId) => {
    if (!projectId || !panelistId) {
      toast.warn('Project or panelist information is missing.');
      return;
    }
    const projectAssignmentData = assignmentsAndVolunteers[projectId];
    if (!projectAssignmentData || !projectAssignmentData.assignmentId) {
        toast.error('Assignment information not found for this project to remove panelist.');
        return;
    }
    const assignmentId = projectAssignmentData.assignmentId;

    setIsLoading(true);
    // console.log(`Removing panelist ${panelistId} from project ${projectId}`);
    try {
      // Backend expects projectId and userId (for panelistId)
      const response = await axios.post(API_URLS.removePanelistFromProject, { 
        assignmentId: assignmentId, 
        userId: panelistId 
      });
      if (response.data.success) {
        toast.success(response.data.message || 'Panelist removed successfully!');
        refreshProjectData();
      } else {
        throw new Error(response.data.message || 'Failed to remove panelist.');
      }
    } catch (err) {
      console.error("Error removing panelist:", err.response || err.message);
      toast.error(err.response?.data?.message || err.message || 'Could not remove panelist.');
    }
    setIsLoading(false);
  };

  const handleAssignUserInModal = async () => {
    const { project } = modalConfig;
    if (!selectedUserToAssignInModal || !selectedUserTypeToAssignInModal) {
      toast.warn('Please select a user.');
      return;
    }
    if (!project || !project._id) {
        toast.error('Project information is missing.');
        return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(API_URLS.assignUserToProject, { 
        projectId: project._id, 
        userId: selectedUserToAssignInModal, 
        userType: selectedUserTypeToAssignInModal 
      });
      if (response.data && response.data.success) {
        toast.success(`${selectedUserTypeToAssignInModal.charAt(0).toUpperCase() + selectedUserTypeToAssignInModal.slice(1)} allocated successfully!`);
        refreshProjectData();
        closeModal();
      } else {
        // Directly use the message from the backend if success is false
        const errorMessage = response.data?.message || 'Failed to assign user due to a server validation.';
        toast.error(errorMessage);
        console.error("Assignment validation error from backend:", errorMessage, "Full response:", response.data);
      }
    } catch (err) {
      // This catch block will now primarily handle network errors or unexpected server errors (e.g., 500)
      console.error("Error assigning user from modal (network/unexpected):", err.response || err.message || err);
      const errorMessage = err.response?.data?.message || err.message || 'Could not assign user due to an unexpected error.';
      toast.error(errorMessage);
    }
    setIsLoading(false);
  };
  
  const handleRemoveUser = async (projectId, userId, userType) => {
    const projectAssignmentData = assignmentsAndVolunteers[projectId];
    if (!projectAssignmentData || !projectAssignmentData.assignmentId) {
        toast.error('Assignment information not found for this project to remove user.');
        return;
    }
    const assignmentId = projectAssignmentData.assignmentId;

    setIsLoading(true);
    try {
      const response = await axios.delete(API_URLS.removeUserFromProject, { 
        data: { assignmentId, userId, userType } 
      }); 
      if (response.data && response.data.success) {
        toast.success(response.data.message || `${userType.charAt(0).toUpperCase() + userType.slice(1)} removed successfully!`);
        refreshProjectData();
      } else {
        throw new Error(response.data.message || 'Failed to remove user.');
      }
    } catch (err) {
      console.error("Error removing user:", err.response || err.message);
      toast.error(err.response?.data?.message || err.message || 'Could not remove user.');
    }
    setIsLoading(false);
  };

  const handleReviewVolunteer = async (projectId, userId, userType, status) => {
    const projectAssignmentData = assignmentsAndVolunteers[projectId];
     if (!projectAssignmentData || !projectAssignmentData.assignmentId) {
        toast.error('Assignment information not found for this project to review volunteer.');
        return;
    }
    const assignmentId = projectAssignmentData.assignmentId;

    setIsLoading(true);
    try {
      const response = await axios.put(API_URLS.reviewVolunteerRequest, { 
        assignmentId, 
        userId, 
        userType, 
        status 
      });
      if (response.data && response.data.success) {
        toast.success(response.data.message || `Volunteer request ${status} successfully!`);
        refreshProjectData();
      } else {
        throw new Error(response.data.message || `Failed to ${status} volunteer.`);
      }
    } catch (err) {
      console.error(`Error ${status} volunteer:`, err.response || err.message);
      toast.error(err.response?.data?.message || err.message || `Could not ${status} volunteer.`);
    }
    setIsLoading(false);
  };
  
  // Handle initializing project assignment for projects without one
  const handleInitializeProjectAssignment = async (projectId) => {
    setIsLoading(true);
    try {
      const response = await axios.post(API_URLS.initializeProjectAssignment, { 
        projectId 
      });
      if (response.data && response.data.success) {
        toast.success('Chat initialized successfully! You can now access the chat room.');
        // Refresh data to show the new assignment and chat button
        await fetchData();
      } else {
        throw new Error(response.data.message || 'Failed to initialize project assignment.');
      }
    } catch (err) {
      console.error("Error initializing project assignment:", err.response || err.message);
      toast.error(err.response?.data?.message || err.message || 'Could not initialize project assignment.');
    }
    setIsLoading(false);
  };
  
  // Render Logic
  if (isLoading && !projects.length && !error) {
    return <div className="container mx-auto p-6 text-center"><p className="text-lg">Loading project assignments data...</p></div>;
  }
  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-red-500 text-lg font-semibold">Error loading data:</p>
        <p className="text-red-400 mb-4">{error}</p>
        <p className="text-gray-500">Please ensure the backend is running and you are properly authenticated. Check the browser console (F12) for more detailed error messages from the API calls. You might need to refresh the page or try again later.</p>
        <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    );
  }
  if (!projects.length) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-gray-600 text-lg">No projects found for your company.</p>
        <p className="text-gray-500">Ensure projects have been created and approved for your company. If you believe this is an error, please check the console for API responses or contact support.</p>
         <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Refresh Data
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Manage Project Assignments</h1>
      <div className="mb-6 text-center">
        <button
          onClick={openUniversalNotifyModal}
          className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Notify All Members of All Projects
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.filter(project => project.isApproved).map(project => (
              <tr key={project._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{project.name}</div>
                  <div className="text-xs text-gray-500">{project.description?.substring(0,50) + (project.description?.length > 50 ? '...' : '')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {/* Chat Button or Initialize Chat Button */}
                  {assignmentsAndVolunteers[project._id]?.assignmentId ? (
                    <Link 
                      to={`/dashboard/chat/${assignmentsAndVolunteers[project._id].assignmentId}`}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <FaComments className="mr-1" />
                      Chat
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleInitializeProjectAssignment(project._id)}
                      disabled={isLoading}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-purple-500 rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      <FaComments className="mr-1" />
                      Initialize Chat
                    </button>
                  )}
                  <button 
                    onClick={() => openModal('viewAssigned', project, 'developer')} 
                    className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >View Devs</button>
                  <button 
                    onClick={() => openModal('assignUser', project, 'developer')} 
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >Assign Dev</button>
                  <button 
                    onClick={() => openModal('viewAssigned', project, 'intern')} 
                    className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >View Interns</button>
                  <button 
                    onClick={() => openModal('assignUser', project, 'intern')} 
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >Assign Intern</button>
                  <button
                    onClick={() => openViewPanelistsModal(project)}
                    className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Panelists
                  </button>
                  <button
                    onClick={() => openPanelistModal(project)}
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Assign Panelists
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Implementation */}
      {isModalOpen && (
        <div className="fixed z-30 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true"> {/* Updated z-index to z-30 */}
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {modalConfig.type === 'viewAssigned' ? `View Assigned ${modalConfig.userType === 'developer' ? 'Developers' : 'Interns'}` : `Assign ${modalConfig.userType === 'developer' ? 'Developer' : 'Intern'}`} for "{
                        modalConfig.project?.name?.trim() 
                          ? modalConfig.project.name 
                          : modalConfig.project?.description?.trim() 
                            ? (modalConfig.project.description.substring(0, 40) + (modalConfig.project.description.length > 40 ? '...' : ''))
                            : 'Selected Project'
                      }"
                    </h3>
                    <div className="mt-2 mb-4">
                        <input 
                            type="text"
                            placeholder={`Search ${modalConfig.userType}s...`}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={modalSearchTerm}
                            onChange={(e) => setModalSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="mt-4 w-full">
                      {modalConfig.type === 'viewAssigned' && (
                        <div>
                          {/* List assigned users */}
                          <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
                            {(modalConfig.userType === 'developer' 
                              ? assignmentsAndVolunteers[modalConfig.project?._id]?.assignedDevelopers 
                              : assignmentsAndVolunteers[modalConfig.project?._id]?.assignedInterns
                            )?.filter(userAss => {
                                const userName = userAss.userId?.name || '';
                                const userEmail = userAss.userId?.email || '';
                                return userName.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
                                       userEmail.toLowerCase().includes(modalSearchTerm.toLowerCase());
                            }).map(userAssignment => (
                              <li key={userAssignment.userId?._id || userAssignment.userId} className="text-sm text-gray-700 flex justify-between items-center py-1">
                                <span>{userAssignment.userId?.name || userAssignment.userId?.email || 'Unknown User'}</span>
                                <button 
                                  onClick={() => handleRemoveUser(modalConfig.project._id, userAssignment.userId?._id || userAssignment.userId, modalConfig.userType)}
                                  className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                                  disabled={isLoading}
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                          {((modalConfig.userType === 'developer' 
                              ? assignmentsAndVolunteers[modalConfig.project?._id]?.assignedDevelopers 
                              : assignmentsAndVolunteers[modalConfig.project?._id]?.assignedInterns
                            )?.length === 0 || !assignmentsAndVolunteers[modalConfig.project?._id]) && (
                            <p className="text-sm text-gray-500">No {modalConfig.userType}s currently assigned.</p>
                          )}
                          {/* Pending Volunteers for this project and userType */}
                          <h4 className="text-md font-semibold text-gray-700 mt-4 mb-2">Pending Volunteer Requests</h4>
                          <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
                             {(modalConfig.userType === 'developer' 
                              ? assignmentsAndVolunteers[modalConfig.project?._id]?.pendingVolunteerDevelopers
                              : assignmentsAndVolunteers[modalConfig.project?._id]?.pendingVolunteerInterns
                            )?.filter(vol => {
                                const volunteerName = vol.userId?.name || '';
                                const volunteerEmail = vol.userId?.email || '';
                                return volunteerName.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
                                       volunteerEmail.toLowerCase().includes(modalSearchTerm.toLowerCase());
                            }).map(volunteer => (
                              <li key={volunteer.userId?._id || volunteer.userId} className="text-sm text-gray-700 py-1">
                                <span>{volunteer.userId?.name || volunteer.userId?.email || 'Unknown Volunteer'} (Requested: {new Date(volunteer.requestedAt).toLocaleDateString()})</span>
                                <div className="inline-block ml-2 space-x-1">
                                  <button 
                                    onClick={() => handleReviewVolunteer(modalConfig.project._id, volunteer.userId?._id || volunteer.userId, modalConfig.userType, 'approved')} 
                                    className="bg-green-500 hover:bg-green-600 text-white py-0.5 px-2 rounded text-xs disabled:opacity-50"
                                    disabled={isLoading}
                                  >Approve</button>
                                  <button 
                                    onClick={() => handleReviewVolunteer(modalConfig.project._id, volunteer.userId?._id || volunteer.userId, modalConfig.userType, 'rejected')} 
                                    className="bg-red-500 hover:bg-red-600 text-white py-0.5 px-2 rounded text-xs disabled:opacity-50"
                                    disabled={isLoading}
                                  >Reject</button>
                                </div>
                              </li>
                            ))}
                          </ul>
                           {((modalConfig.userType === 'developer' 
                              ? assignmentsAndVolunteers[modalConfig.project?._id]?.pendingVolunteerDevelopers
                              : assignmentsAndVolunteers[modalConfig.project?._id]?.pendingVolunteerInterns
                            )?.length === 0 || !assignmentsAndVolunteers[modalConfig.project?._id]) && (
                            <p className="text-sm text-gray-500">No pending {modalConfig.userType} volunteer requests for this project.</p>
                          )}
                        </div>
                      )}
                      {modalConfig.type === 'assignUser' && (
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="user-select-modal" className="block text-sm font-medium text-gray-700">Select {modalConfig.userType}</label>
                            <select
                              id="user-select-modal"
                              value={selectedUserToAssignInModal}
                              onChange={(e) => {
                                setSelectedUserToAssignInModal(e.target.value);
                                setSelectedUserTypeToAssignInModal(modalConfig.userType);
                              }}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                              <option value="">-- Select User --</option>
                              {users
                                .filter(user => {
                                  if (user.type !== modalConfig.userType || !user.isApproved || !user.verified) {
                                    return false;
                                  }
                                  if (modalConfig.userType === 'developer' && modalConfig.project?._id) {
                                    const projectAssignments = assignmentsAndVolunteers[modalConfig.project._id];
                                    if (projectAssignments?.panelists?.some(p => p.userId?._id === user._id || p.userId === user._id)) {
                                      return false; // Don't show if already a panelist for this project
                                    }
                                  }
                                  return ((user.name || '').toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                          (user.email || '').toLowerCase().includes(modalSearchTerm.toLowerCase()));
                                })
                                .map(user => (
                                  <option key={user._id} value={user._id}>{user.name || user.email} ({user.company})</option>
                                ))}
                            </select>
                          </div>
                          {/* Hidden input for user type, though it\'s fixed by the modal context */}
                           <input type="hidden" value={selectedUserTypeToAssignInModal} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {modalConfig.type === 'assignUser' && (
                  <button 
                    type="button" 
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    onClick={handleAssignUserInModal}
                    disabled={isLoading || !selectedUserToAssignInModal}
                  >
                    {isLoading ? 'Assigning...' : 'Assign User'}
                  </button>
                )}
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panelist Modal Implementation */}
      {isPanelistModalOpen && currentProjectForPanelistModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="panelist-modal-title" role="dialog" aria-modal="true"> {/* Updated z-index to z-50 */}
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closePanelistModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-xl leading-6 font-medium text-gray-900 mb-6" id="panelist-modal-title">
                      Manage Panelists for "{
                        currentProjectForPanelistModal?.name?.trim()
                          ? currentProjectForPanelistModal.name
                          : currentProjectForPanelistModal?.description?.trim()
                            ? (currentProjectForPanelistModal.description.substring(0, 40) + (currentProjectForPanelistModal.description.length > 40 ? '...' : ''))
                            : 'Selected Project'
                      }"
                    </h3>
                    
                    {/* Section 1: Assign Specific Developer as Panelist */}
                    <div className="mb-6 pb-4 border-b border-gray-200">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">1. Assign Specific Developer as Panelist</h4>
                      <input
                          type="text"
                          placeholder="Search developers by name or email..."
                          className="w-full p-2 mb-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={panelistAssignSearchTerm}
                          onChange={(e) => setPanelistAssignSearchTerm(e.target.value)}
                      />
                      <select
                        value={selectedDeveloperForPanelistRole}
                        onChange={(e) => setSelectedDeveloperForPanelistRole(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md mb-2"
                      >
                        <option value="">-- Select Developer --</option>
                        {users
                          .filter(user => {
                            if (user.type !== 'developer' || !user.isApproved || !user.verified) {
                              return false;
                            }
                            if (currentProjectForPanelistModal?._id) {
                              const projectAssignments = assignmentsAndVolunteers[currentProjectForPanelistModal._id];
                              // Exclude if already a mentor (assignedDeveloper) for this project
                              if (projectAssignments?.assignedDevelopers?.some(d => d.userId?._id === user._id || d.userId === user._id)) {
                                return false;
                              }
                            }
                            return ((user.name || '').toLowerCase().includes(panelistAssignSearchTerm.toLowerCase()) ||
                                    (user.email || '').toLowerCase().includes(panelistAssignSearchTerm.toLowerCase()));
                          })
                          .map(user => (
                            <option key={user._id} value={user._id}>{user.name || user.email} ({user.company})</option>
                          ))}
                      </select>
                      <button
                        onClick={handleAssignDeveloperAsPanelist}
                        disabled={isLoading || !selectedDeveloperForPanelistRole}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Assigning...' : 'Assign as Panelist'}
                      </button>
                    </div>

                    {/* Section 2: Assign Random Panelist (Non-Mentor) */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-2">2. Assign Random Panelist</h4>
                      <p className="text-sm text-gray-600 mb-3">This will assign a random developer from your company who is not a designated mentor for this project.</p>
                      <button 
                        onClick={handleAssignRandomPanelist}
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Assigning...' : 'Assign Random Panelist'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closePanelistModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Panelists Modal Implementation */}
      {isViewPanelistsModalOpen && currentProjectForViewPanelistsModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="view-panelists-modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeViewPanelistsModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-xl leading-6 font-medium text-gray-900 mb-4" id="view-panelists-modal-title">
                      View Assigned Panelists for "{
                        currentProjectForViewPanelistsModal?.name?.trim()
                          ? currentProjectForViewPanelistsModal.name
                          : currentProjectForViewPanelistsModal?.description?.trim()
                            ? (currentProjectForViewPanelistsModal.description.substring(0, 40) + (currentProjectForViewPanelistsModal.description.length > 40 ? '...' : ''))
                            : 'Selected Project'
                      }"
                    </h3>
                    <input 
                        type="text"
                        placeholder="Search panelists by name or email..."
                        className="w-full p-2 mb-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={viewPanelistsSearchTerm}
                        onChange={(e) => setViewPanelistsSearchTerm(e.target.value)}
                    />
                    <div className="mt-2 max-h-60 overflow-y-auto">
                      {assignmentsAndVolunteers[currentProjectForViewPanelistsModal._id]?.panelists && assignmentsAndVolunteers[currentProjectForViewPanelistsModal._id].panelists.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {assignmentsAndVolunteers[currentProjectForViewPanelistsModal._id].panelists
                            .filter(panelist => {
                                const panelistName = panelist.userId?.name || '';
                                const panelistEmail = panelist.userId?.email || '';
                                return panelistName.toLowerCase().includes(viewPanelistsSearchTerm.toLowerCase()) || 
                                       panelistEmail.toLowerCase().includes(viewPanelistsSearchTerm.toLowerCase());
                            })
                            .map(panelist => (
                            <li key={panelist.userId?._id || panelist.userId} className="text-sm text-gray-700 flex justify-between items-center py-1">
                              <span>{panelist.userId?.name || panelist.userId?.email || 'Unknown Panelist'}</span>
                              <button 
                                onClick={() => handleRemovePanelistFromProject(currentProjectForViewPanelistsModal._id, panelist.userId?._id || panelist.userId)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                                disabled={isLoading}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">No panelists currently assigned to this project.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeViewPanelistsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notify Members Modal Implementation */}
      {isNotifyModalOpen && currentProjectForNotifyModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="notify-modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeNotifyModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-xl leading-6 font-medium text-gray-900 mb-4" id="notify-modal-title">
                      Notify Members of "{currentProjectForNotifyModal.name}"
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="notify-subject" className="block text-sm font-medium text-gray-700">Subject</label>
                        <input 
                          type="text" 
                          name="notify-subject" 
                          id="notify-subject" 
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={notifySubject}
                          onChange={(e) => setNotifySubject(e.target.value)}
                          placeholder="Optional: Email Subject"
                        />
                      </div>
                      <div>
                        <label htmlFor="notify-message" className="block text-sm font-medium text-gray-700">Message</label>
                        <textarea 
                          id="notify-message" 
                          name="notify-message" 
                          rows={4} 
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={notifyMessage}
                          onChange={(e) => setNotifyMessage(e.target.value)}
                          placeholder="Enter your notification message here..."
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={handleSendNotification}
                  disabled={isLoading || !notifyMessage.trim()}
                >
                  {isLoading ? 'Sending...' : 'Send Notification'}
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeNotifyModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Notify Modal Implementation */}
      {isUniversalNotifyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Confirm Universal Notification</h3>
            {lastUniversalNotificationTime && (
              <p className="mb-4 text-sm text-gray-600">
                Last universal notification was sent at: {lastUniversalNotificationTime}
              </p>
            )}
            <p className="mb-4">Are you sure you want to send a standardized notification to all members of all your projects? This action cannot be undone.</p>
            {/* Removed subject and message inputs */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleSendUniversalNotification}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Yes, Send Notifications'}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={closeUniversalNotifyModal}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProjectAssignments;
