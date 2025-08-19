import React, { useState, useEffect, useRef } from 'react';
import api from '../../../utils/axios';
import { Link } from 'react-router-dom';
import { FaComments } from 'react-icons/fa';
import { io } from 'socket.io-client';
window.io = io;
console.log('AssignedProjects.jsx loaded');

const AssignedProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({}); // { [projectAssignmentId]: count }
    const socketRef = useRef(null);

    useEffect(() => {
        const fetchAssignedProjects = async () => {
            try {
                setLoading(true);
                // Get current user info from token
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }
                
                // Decode token to get user ID
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.userId || payload.id || payload._id;
                
                const response = await api.get(`/api/project-assignments/intern/${userId}`);
                
                if (response.data.success) {
                    setProjects(response.data.data);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch assigned projects');
                }
            } catch (err) {
                console.error('Error fetching assigned projects:', err);
                setError(err.response?.data?.message || err.message || 'Failed to fetch assigned projects');
            } finally {
                setLoading(false);
            }
        };

        fetchAssignedProjects();
    }, []);

    // --- SOCKET.IO UNREAD BADGE LOGIC ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('SOCKET: No token found, skipping socket connection');
            return;
        }
        console.log('SOCKET: attempting connection to http://localhost:8000');
        socketRef.current = io('http://localhost:8000', {
            auth: { token }
        });
        const socket = socketRef.current;
        socket.on('connect', () => {
            console.log('SOCKET: connected', socket.id);
            projects.forEach((assignment) => {
                console.log('SOCKET: joining room', assignment._id);
                socket.emit('joinProjectRoom', assignment._id);
            });
        });
        socket.on('connect_error', (err) => {
            console.error('SOCKET: connect_error', err);
        });
        socket.on('disconnect', () => {
            console.warn('SOCKET: disconnected');
        });
        socket.on('receiveMessage', (message) => {
            console.log('SOCKET: receiveMessage event fired', message);
            let chatId = null;
            if (message.conversation && typeof message.conversation === 'object') {
                chatId = message.conversation.projectAssignment || message.conversation._id;
            }
            chatId = chatId || message.projectAssignment || message.projectAssignmentId;
            console.log('SOCKET: extracted chatId', chatId);
            if (!chatId) return;
            if (!window.location.pathname.startsWith(`/dashboard/chat/${chatId}`)) {
                console.log('SOCKET: incrementing unread for', chatId);
                setUnreadCounts(prev => ({
                    ...prev,
                    [chatId]: (prev[chatId] || 0) + 1
                }));
            }
        });
        return () => socket.disconnect();
    }, [projects]);

    useEffect(() => {
        // Reset unread count for the project when its chat is opened
        const match = window.location.pathname.match(/\/dashboard\/chat\/([a-zA-Z0-9]+)/);
        if (match) {
            const chatId = match[1];
            setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
        }
    }, [window.location.pathname]);
    // --- END SOCKET.IO LOGIC ---

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
            <h1 className="text-3xl text-center font-bold mb-6 text-gray-800">Assigned Project Details </h1>
            {projects.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold mb-2">No Projects Assigned</h3>
                    <p>You have not been assigned to any projects yet.</p>
                </div>
            ) : (
                <div className="flex justify-center flex-wrap gap-6">
                    {projects.map((assignment) => (
                        <div key={assignment._id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300 w-full max-w-2xl">
                            {/* Project Header */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-bold text-gray-800">{assignment.project?.name || 'Untitled Project'}</h2>
                                    {/* --- CHAT BUTTON WITH BADGE --- */}
                                    <div className="relative inline-block">
                                        <Link to={`/dashboard/chat/${assignment._id}`} className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700">
                                            <FaComments className="mr-2" />
                                            Project Chat
                                        </Link>
                                        {unreadCounts[assignment._id] > 0 && (
                                            <span
                                                className="absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-20 px-1.5 border-2 border-white"
                                            >
                                                {unreadCounts[assignment._id]}
                                            </span>
                                        )}
                                    </div>
                                    {/* --- END CHAT BUTTON WITH BADGE --- */}
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{assignment.project?.description || 'No description available.'}</p>
                                
                                {/* Project Details */}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                    {assignment.project?.estimatedTimeToComplete && (
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Duration: {assignment.project.estimatedTimeToComplete}
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Skills Required */}
                                {assignment.project?.skillRequirement && assignment.project.skillRequirement.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-700 mb-2">Skills Required:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {assignment.project.skillRequirement.map((skill, index) => (
                                                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Team Information */}
                            <div className="space-y-4">
                                {/* Mentors Section */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Mentors ({assignment.mentors?.length || 0})
                                    </h3>
                                    {assignment.mentors && assignment.mentors.length > 0 ? (
                                        <div className="space-y-2">
                                            {assignment.mentors.map((mentor, index) => (
                                                <div key={index} className="bg-green-50 p-3 rounded-lg">
                                                    <p className="font-medium text-gray-800">{mentor.name}</p>
                                                    <p className="text-sm text-gray-600">{mentor.email}</p>
                                                    {mentor.assignedAt && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Assigned: {new Date(mentor.assignedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No mentors assigned yet</p>
                                    )}
                                </div>

                                {/* Panelists Section */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Panelists ({assignment.panelists?.length || 0})
                                    </h3>
                                    {assignment.panelists && assignment.panelists.length > 0 ? (
                                        <div className="space-y-2">
                                            {assignment.panelists.map((panelist, index) => (
                                                <div key={index} className="bg-purple-50 p-3 rounded-lg">
                                                    <p className="font-medium text-gray-800">{panelist.name}</p>
                                                    <p className="text-sm text-gray-600">{panelist.email}</p>
                                                    {panelist.assignedAt && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Assigned: {new Date(panelist.assignedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No panelists assigned yet</p>
                                    )}
                                </div>

                                {/* Interns Section */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.197-5.977" />
                                        </svg>
                                        Interns ({assignment.interns?.length || 0})
                                    </h3>
                                    {assignment.interns && assignment.interns.length > 0 ? (
                                        <div className="space-y-2">
                                            {assignment.interns.map((intern, index) => (
                                                <div key={index} className="bg-blue-50 p-3 rounded-lg">
                                                    <p className="font-medium text-gray-800">{intern.name}</p>
                                                    <p className="text-sm text-gray-600">{intern.email}</p>
                                                    {intern.assignedAt && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Assigned: {new Date(intern.assignedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No other interns assigned.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssignedProjects;
