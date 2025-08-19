import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import api from '../../utils/axios';

const SuggestProjectModal = ({ isOpen, onClose, onProjectSuggested }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        estimatedTimeToComplete: '',
        skillRequirement: '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [company, setCompany] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset form on open
            setFormData({
                name: '',
                description: '',
                estimatedTimeToComplete: '',
                skillRequirement: '',
            });
            setError(null);

            // Fetch user's company from token
            const token = localStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCompany(payload.company || '');
            }
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!formData.name || !formData.description) {
            setError('Project name and description are required.');
            setLoading(false);
            return;
        }

        try {
            const skills = formData.skillRequirement.split(',').map(skill => skill.trim()).filter(Boolean);
            
            const projectData = {
                ...formData,
                skillRequirement: skills,
                company: company, // Add company to the payload
            };

            const response = await api.post('/api/projects/add', projectData);

            if (response.data.success) {
                onProjectSuggested();
                onClose();
            } else {
                setError(response.data.message || 'Failed to suggest project.');
            }
        } catch (err) {
            console.error("Error suggesting project:", err);
            setError(err.response?.data?.message || 'An error occurred while suggesting the project.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Suggest a New Project</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FaTimes size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                    {error && <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{error}</div>}
                    
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="estimatedTimeToComplete" className="block text-sm font-medium text-gray-700 mb-1">Estimated Time to Complete (e.g., 3 months)</label>
                        <input
                            type="text"
                            id="estimatedTimeToComplete"
                            name="estimatedTimeToComplete"
                            value={formData.estimatedTimeToComplete}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="skillRequirement" className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
                        <input
                            type="text"
                            id="skillRequirement"
                            name="skillRequirement"
                            value={formData.skillRequirement}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </form>

                <div className="flex justify-end items-center p-6 border-t border-gray-200 space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                            </>
                        ) : 'Submit Suggestion'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuggestProjectModal;
