import React, { useState, useEffect } from 'react';
import api from '../../../utils/axios';
import { toast } from 'react-toastify';

const DeveloperAvailableProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableProjects = async () => {
      try {
        const response = await api.get('/api/projects/available-for-developer');
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
      toast.success('Successfully volunteered as a mentor for the project!');
      // Refresh the list of available projects
      const response = await api.get('/api/projects/available-for-developer');
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error volunteering for project:', error);
      toast.error(error.response?.data?.message || 'Failed to volunteer for the project.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl text-center font-bold mb-6 text-gray-800">Available Projects for Mentoring</h1>
      {projects.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2">No Available Projects</h3>
          <p>No projects are currently available for volunteering as a mentor, or you may already be assigned to a project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{project.name || 'Untitled Project'}</h2>
                <p className="text-gray-600 text-sm mb-4">{project.description || 'No description available.'}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <strong>Company:</strong> {project.company}
                </div>

                {project.skillRequirement && project.skillRequirement.length > 0 && (
                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <strong>Skills Required:</strong>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-6">
                      {project.skillRequirement.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.estimatedTimeToComplete && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <strong>Duration:</strong> {project.estimatedTimeToComplete}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleVolunteer(project._id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Volunteer as Mentor
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeveloperAvailableProjects;
