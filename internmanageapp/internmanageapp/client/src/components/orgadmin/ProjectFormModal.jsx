import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const ProjectFormModal = ({ isOpen, onClose, onSave, project, isLoading: propIsLoading, error: propError, currentUserCompany }) => {
  // Define initialFormData structure WITH the company field
  const initialFormDataState = {
    name: '', // Add name field
    description: '',
    skillRequirement: '', 
    estimatedTimeToComplete: '',
    company: '' 
  };

  const [formData, setFormData] = useState(initialFormDataState);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (project) { // Editing existing project
        setFormData({
          name: project.name || '', // Add name
          description: project.description || '',
          skillRequirement: Array.isArray(project.skillRequirement) ? project.skillRequirement.join(', ') : '',
          estimatedTimeToComplete: project.estimatedTimeToComplete || '',
          company: project.company || '' // Use company from the project being edited
        });
      } else { // Adding new project
        setFormData({
          ...initialFormDataState, // Reset to initial state
          company: currentUserCompany || '' // Then set company from prop
        });
      }
      setLocalError(null); 
    }
  }, [project, isOpen, currentUserCompany]); 

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.name.trim() || !formData.description.trim() || !formData.skillRequirement.trim() || !formData.estimatedTimeToComplete.trim()) {
      setLocalError("Name, Description, Skill Requirements, and Estimated Time are required.");
      return;
    }
    // Ensure company is present when adding, it should be set from currentUserCompany
    if (!project && !formData.company) { 
        setLocalError("Company information is missing. Cannot add project.");
        return;
    }

    const skillRequirementArray = formData.skillRequirement.split(',').map(skill => skill.trim()).filter(skill => skill);
    
    if (skillRequirementArray.length === 0) {
        setLocalError("At least one skill requirement must be provided.");
        return;
    }

    const payload = {
      ...formData, // formData now includes the company
      skillRequirement: skillRequirementArray,
    };
    
    onSave(payload);
  };

  const formFields = [
    { name: 'name', label: 'Project Name', type: 'text', required: true }, // Add name field
    { name: 'description', label: 'Project Description', type: 'textarea', required: true },
    { name: 'skillRequirement', label: 'Skill Requirements (comma-separated)', type: 'text', required: true },
    { name: 'estimatedTimeToComplete', label: 'Estimated Time to Complete (e.g., 3 weeks)', type: 'text', required: true },
    // Company field is NOT added here as it's not meant to be manually edited by the HR user in this form.
    // It's derived either from the existing project (for edit) or currentUserCompany (for add).
  ];
  
  const currentError = propError || localError;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">{project ? 'Edit Project' : 'Add New Project'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <FaTimes size={24} />
          </button>
        </div>

        {currentError && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{currentError}</div>}

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-y-4">
            {formFields.map(field => (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    rows={3}
                    required={field.required}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <input
                    type={field.type}
                    id={field.name}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={propIsLoading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={propIsLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:bg-blue-400"
            >
              {propIsLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (project ? 'Save Changes' : 'Add Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
