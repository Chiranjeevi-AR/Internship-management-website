import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import api from '../../../utils/axios';
import SuggestProjectModal from '../../../components/developer/SuggestProjectModal';

const DeveloperProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/projects/all');
            if (response.data.success) {
                setProjects(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to fetch projects');
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError(err.response?.data?.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleProjectSuggested = () => {
        fetchProjects(); // Re-fetch projects after a new one is suggested
    };

    if (loading) {
        return <div className="text-center p-8">Loading projects...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition duration-150"
                >
                    <FaPlus className="mr-2" /> Suggest Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                    <div key={project._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-bold text-gray-800">{project.name}</h2>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${project.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {project.isApproved ? 'Approved' : 'Yet to be Approved'}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-4">{project.description}</p>
                        </div>
                        <div className="text-sm text-gray-500 mt-4">
                            {project.suggested_by && <p><strong>Suggested by:</strong> {project.suggested_by}</p>}
                        </div>
                    </div>
                ))}
            </div>

            <SuggestProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectSuggested={handleProjectSuggested}
            />
        </div>
    );
};

export default DeveloperProjects;
