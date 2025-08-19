import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import { toast } from 'react-toastify';

const AvailableProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableProjects = async () => {
      try {
        const response = await api.get('/api/projects/available-for-intern');
        setProjects(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching available projects:', error);
        toast.error('Failed to fetch available projects.');
        setLoading(false);
      }
    };

    fetchAvailableProjects();
  }, []);

  const handleVolunteer = async (projectId) => {
    try {
      await api.post('/api/project-assignments/volunteer', { projectId });
      toast.success('Successfully volunteered for the project!');
      // Refresh the list of available projects
      const response = await api.get('/api/projects/available-for-intern');
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error volunteering for project:', error);
      toast.error(error.response?.data?.message || 'Failed to volunteer for the project.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Available Projects</h1>
      {projects.length === 0 ? (
        <p>No projects are currently available for volunteering.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
              <p className="text-gray-700 mb-4">{project.description}</p>
              <div className="mb-4">
                <p><strong>Company:</strong> {project.company}</p>
                <p><strong>Skills Required:</strong> {project.skillRequirement.join(', ')}</p>
                <p><strong>Estimated Duration:</strong> {project.estimatedTimeToComplete}</p>
              </div>
              <button
                onClick={() => handleVolunteer(project._id)}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Volunteer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableProjects;
