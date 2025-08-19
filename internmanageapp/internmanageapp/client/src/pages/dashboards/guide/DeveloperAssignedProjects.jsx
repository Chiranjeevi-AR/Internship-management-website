import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import { FaUserGraduate, FaFileUpload, FaDownload, FaClipboardList, FaFileAlt, FaCheckCircle, FaTimesCircle, FaComments } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom'; // Import Link

const DeveloperAssignedProjects = () => {
    const [projects, setProjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedIntern, setSelectedIntern] = useState(null);

    // Form state
    const [assignmentForm, setAssignmentForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        file: null
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }
                
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userId;

                const projectsResponse = await api.get(`/api/project-assignments/developer/${userId}`);
                console.log('Projects Response:', projectsResponse.data);

                if (!projectsResponse.data.success) {
                    throw new Error(projectsResponse.data.message || 'Failed to fetch project assignments');
                }

                const projectsData = projectsResponse.data.data || [];
                setProjects(projectsData.map(project => ({
                    ...project,
                    assignedInterns: project.assignedInterns && Array.isArray(project.assignedInterns)
                        ? project.assignedInterns
                        : (project.interns && Array.isArray(project.interns) ? project.interns : [])
                })));

                if (projectsData.length > 0) {
                    try {
                        const [assignmentsResponse, reportsResponse] = await Promise.all([
                            api.get('/api/assignments/developer'),
                            api.get('/api/reports/mentor')
                        ]);

                        setAssignments(assignmentsResponse.data.data || []);
                        setReports(reportsResponse.data.data || []);
                    } catch (err) {
                        console.error('Error fetching assignments/reports:', err);
                        toast.error('Failed to fetch assignments or reports');
                    }
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAssignmentSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', assignmentForm.title);
            formData.append('description', assignmentForm.description);
            formData.append('dueDate', assignmentForm.dueDate);
            formData.append('projectId', selectedProject.project._id); // Use the actual project ID
            formData.append('internId', selectedIntern._id);
            formData.append('assignment', assignmentForm.file);

            const response = await api.post('/api/assignments', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setAssignments([...assignments, response.data.data]);
                setShowAssignmentModal(false);
                setAssignmentForm({ title: '', description: '', dueDate: '', file: null });
                toast.success('Assignment created successfully!');
            }
        } catch (err) {
            console.error('Error creating assignment:', err);
            toast.error(err.response?.data?.message || 'Failed to create assignment');
        }
    };
    
    const handleFileDownload = async (fileId, type, fileName) => {
        try {
            const endpoint = type === 'report' ? `/api/reports/download/${fileId}` : `/api/assignments/download/${fileId}`;
            const response = await api.get(endpoint, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || `${type}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('File downloaded successfully!');
        } catch (err) {
            console.error('Error downloading file:', err);
            toast.error('Failed to download file');
        }
    };

    const handleProvideFeedback = async (reportId, feedback) => {
        try {
            const response = await api.post(`/api/reports/${reportId}/feedback`, { feedback });

            if (response.data.success) {
                setReports(reports.map(report => 
                    report._id === reportId ? { ...report, mentorFeedback: feedback, status: 'reviewed' } : report
                ));
                toast.success('Feedback provided successfully!');
            }
        } catch (err) {
            console.error('Error providing feedback:', err);
            toast.error('Failed to provide feedback');
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-red-500 font-semibold text-center">
                    <p>Error: {error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl text-center font-bold mb-6 text-gray-800">My Project Roles</h1>
            {!projects || projects.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold mb-2">No Projects Assigned</h3>
                    <p>You have not been assigned as a mentor or panelist to any projects yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {projects.map((assignment) => (
                        <div key={assignment._id} className="bg-white rounded-lg shadow-md p-6">
                            {/* Project Details */}
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {assignment.project?.name || 'Untitled Project'}
                                </h2>
                                <div className="flex gap-2 items-center">
                                    <Link to={`/dashboard/chat/${assignment._id}`} className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700">
                                        <FaComments className="mr-2" />
                                        Chat
                                    </Link>
                                    {assignment.roles?.map((role, index) => (
                                        <span key={index} className={`px-3 py-1 rounded-full text-sm ${
                                            role === 'Panelist' 
                                                ? 'bg-purple-100 text-purple-800' 
                                                : 'bg-blue-100 text-blue-800'
                                                }`}>
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-600 mt-2">{assignment.project?.description || 'No description available'}</p>
                            <p className="text-sm text-gray-500 mt-1">Company: {assignment.project?.company || 'Unknown'}</p>

                            {/* Assigned Interns Section */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <FaUserGraduate className="text-blue-600" />
                                    Assigned Interns ({assignment.assignedInterns?.length || 0})
                                </h3>
                                {Array.isArray(assignment.assignedInterns) && assignment.assignedInterns.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {assignment.assignedInterns.map((intern) => (
                                            <div key={intern._id} className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="font-medium text-gray-800">{intern.name || 'Unknown Intern'}</h4>
                                                <p className="text-sm text-gray-600">{intern.email || 'No email provided'}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Assigned: {intern.assignedAt ? new Date(intern.assignedAt).toLocaleDateString() : 'Unknown date'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No interns assigned yet.</p>
                                )}
                            </div>

                            {/* Assignments Section */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <FaClipboardList className="text-green-600" />
                                        Assignments
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    {assignments.filter(a => a.projectId === assignment.project._id).length > 0 ? (
                                        assignments.filter(a => a.projectId === assignment.project._id).map(a => (
                                            <div key={a._id} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">{a.title}</h4>
                                                        <p className="text-sm text-gray-600">{a.description}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Due: {new Date(a.dueDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleFileDownload(a._id, 'assignment', a.fileName)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Download Assignment"
                                                    >
                                                        <FaDownload />
                                                    </button>
                                                </div>
                                                <div className="mt-2 text-sm">
                                                    <span className={`px-2 py-1 rounded-full ${
                                                        a.status === 'submitted' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {a.status === 'submitted' ? 'Submitted' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No assignments yet for this project.</p>
                                    )}
                                </div>
                            </div>

                            {/* Reports Section */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <FaFileAlt className="text-indigo-600" />
                                    Intern Reports
                                </h3>
                                <div className="space-y-4">
                                    {reports.filter(report => report.projectAssignment === assignment._id).length > 0 ? (
                                        reports.filter(report => report.projectAssignment === assignment._id).map(report => (
                                            <div key={report._id} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">{report.title}</h4>
                                                        <p className="text-sm text-gray-600">
                                                            Submitted by: {report.intern?.name || 'Unknown Intern'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Submitted: {new Date(report.submissionDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleFileDownload(report._id, 'report', report.reportFile)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="Download Report"
                                                        >
                                                            <FaDownload />
                                                        </button>
                                                        {report.status === 'pending' && (
                                                            <button
                                                                onClick={() => {
                                                                    const feedback = prompt('Enter your feedback for this report:');
                                                                    if (feedback) {
                                                                        handleProvideFeedback(report._id, feedback);
                                                                    }
                                                                }}
                                                                className="text-green-600 hover:text-green-800"
                                                                title="Provide Feedback"
                                                            >
                                                                <FaCheckCircle />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {report.mentorFeedback && (
                                                    <div className="mt-2 p-2 bg-blue-50 rounded">
                                                        <p className="text-sm text-gray-700">
                                                            <strong>Feedback:</strong> {report.mentorFeedback}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="mt-2">
                                                    <span className={`text-sm px-2 py-1 rounded-full ${
                                                        report.status === 'reviewed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {report.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No reports submitted yet for this project.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignmentModal && selectedProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                        <h2 className="text-2xl font-bold mb-4">Create New Assignment</h2>
                        <form onSubmit={handleAssignmentSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <input
                                        type="text"
                                        value={assignmentForm.title}
                                        onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={assignmentForm.description}
                                        onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        rows="4"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                    <input
                                        type="datetime-local"
                                        value={assignmentForm.dueDate}
                                        onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Assignment File (PDF or DOC)</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setAssignmentForm({...assignmentForm, file: e.target.files[0]})}
                                        className="mt-1 block w-full"
                                        accept=".pdf,.doc,.docx"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Assign To</label>
                                    <select
                                        onChange={(e) => setSelectedIntern(selectedProject.assignedInterns.find(intern => intern._id === e.target.value))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select an intern</option>
                                        {selectedProject.assignedInterns.map((intern) => (
                                            <option key={intern._id} value={intern._id}>
                                                {intern.name || 'Unknown Intern'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignmentModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Create Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeveloperAssignedProjects;
