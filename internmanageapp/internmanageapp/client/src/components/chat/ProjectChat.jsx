import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/axios';
import { API_BASE_URL } from '../../config/api'; // Import the base URL
import { toast } from 'react-toastify';
import { FaPaperPlane, FaSpinner, FaUser } from 'react-icons/fa';

const ProjectChat = ({ projectAssignmentId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [projectDetails, setProjectDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Helper function to format dates for grouping
    const formatDateHeader = (date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const messageDate = new Date(date);
        
        if (messageDate.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    };

    // Helper function to check if we need a date separator
    const shouldShowDateSeparator = (currentMessage, previousMessage) => {
        if (!previousMessage) return true;
        
        const currentDate = new Date(currentMessage.createdAt).toDateString();
        const previousDate = new Date(previousMessage.createdAt).toDateString();
        
        return currentDate !== previousDate;
    };

    // Helper function to format time
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    // Helper function to get user initials for avatar
    const getUserInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    };

    // Helper function to get user color based on type
    const getUserTypeColor = (type) => {
        const colors = {
            'hr': 'bg-purple-500',
            'admin': 'bg-red-500',
            'developer': 'bg-green-500',
            'guide': 'bg-green-500',
            'intern': 'bg-blue-500',
            'candidate': 'bg-gray-500'
        };
        return colors[type] || 'bg-gray-500';
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchChatData = useCallback(async () => {
        setLoading(true);
        try {
            const [messagesRes, assignmentRes, meRes] = await Promise.all([
                api.get(`/api/chat/${projectAssignmentId}/messages`),
                api.get(`/api/project-assignments/${projectAssignmentId}`),
                api.get('/api/auth/me')
            ]);

            if (messagesRes.data.success) setMessages(messagesRes.data.data);
            if (assignmentRes.data.success) setProjectDetails(assignmentRes.data.data);
            if (meRes.data.success) setCurrentUser(meRes.data.user);

        } catch (error) {
            toast.error("Failed to load chat history.");
            console.error("Chat data fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [projectAssignmentId]);

    useEffect(() => {
        fetchChatData();
    }, [fetchChatData]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !projectAssignmentId) return;

        // Use the centralized API_BASE_URL for the socket connection
        socketRef.current = io(API_BASE_URL, {
            auth: { token },
            transports: ['websocket', 'polling'] // Prioritize websocket
        });

        const socket = socketRef.current;

        socket.emit('joinProjectRoom', projectAssignmentId);

        socket.on('receiveMessage', (message) => {
            setMessages(prevMessages => [...prevMessages, message]);
        });

        socket.on('connect_error', (err) => {
            console.error("Socket connection error:", err.message);
            toast.error("Chat connection failed. Please refresh.");
        });

        return () => {
            socket.disconnect();
        };
    }, [projectAssignmentId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socketRef.current) {
            socketRef.current.emit('sendMessage', {
                projectAssignmentId,
                content: newMessage
            });
            setNewMessage('');
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-96"><FaSpinner className="animate-spin text-3xl text-blue-500" /></div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-white shadow-xl rounded-lg border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                    {projectDetails?.projectId?.name || 'Project Chat'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </p>
            </div>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                <div className="p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">💬</div>
                            <p className="text-gray-500 text-lg">No messages yet</p>
                            <p className="text-gray-400 text-sm">Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <React.Fragment key={msg._id}>
                                {/* Date Separator */}
                                {shouldShowDateSeparator(msg, messages[index - 1]) && (
                                    <div className="flex items-center justify-center my-6">
                                        <div className="flex-1 border-t border-gray-300"></div>
                                        <div className="px-4 py-2 bg-white border border-gray-300 rounded-full shadow-sm">
                                            <span className="text-sm font-medium text-gray-600">
                                                {formatDateHeader(msg.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex-1 border-t border-gray-300"></div>
                                    </div>
                                )}
                                
                                {/* Message */}
                                <div className={`flex items-end space-x-2 ${
                                    msg.sender._id === currentUser?._id ? 'justify-end' : 'justify-start'
                                }`}>
                                    {/* Avatar for other users */}
                                    {msg.sender._id !== currentUser?._id && (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getUserTypeColor(msg.sender.type)} shadow-md`}>
                                            {getUserInitials(msg.sender.name)}
                                        </div>
                                    )}
                                    
                                    {/* Message Bubble */}
                                    <div className={`max-w-xs lg:max-w-md ${
                                        msg.sender._id === currentUser?._id 
                                            ? 'order-1' 
                                            : 'order-2'
                                    }`}>
                                        {/* Sender Name (only for other users) */}
                                        {msg.sender._id !== currentUser?._id && (
                                            <div className="text-xs font-semibold text-gray-600 mb-1 ml-1">
                                                {msg.sender.name}
                                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    getUserTypeColor(msg.sender.type)
                                                } text-white`}>
                                                    {msg.sender.type}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Message Content */}
                                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                            msg.sender._id === currentUser?._id
                                                ? 'bg-blue-500 text-white rounded-br-md'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                                        }`}>
                                            <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                                            
                                            <p className={`text-xs mt-2 ${
                                                msg.sender._id === currentUser?._id 
                                                    ? 'text-blue-100' 
                                                    : 'text-gray-500'
                                            } text-right`}>
                                                {formatTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {msg.sender._id === currentUser?._id && (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getUserTypeColor(msg.sender.type)} shadow-md order-2`}>
                                            {getUserInitials(msg.sender.name)}
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                <form onSubmit={sendMessage} className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-gray-50 transition-all duration-200"
                            maxLength={1000}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                            {newMessage.length}/1000
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                            newMessage.trim() 
                                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <FaPaperPlane className={`text-sm ${newMessage.trim() ? 'animate-pulse' : ''}`} />
                    </button>
                </form>
                
                {/* Message Info */}
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Press Enter to send</span>
                    {currentUser && (
                        <span className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-1 ${getUserTypeColor(currentUser.type)}`}></div>
                            {currentUser.name} ({currentUser.type})
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectChat;
