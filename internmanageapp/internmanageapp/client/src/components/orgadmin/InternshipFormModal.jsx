import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const InternshipFormModal = ({ isOpen, onClose, onSave, internship, isLoading: propIsLoading, error: propError }) => {
  const initialFormData = {
    role: '',
    location: '',
    internshipStartDate: '',
    internshipEndDate: '',
    duration: '',
    type: 'Full-time',
    skills: '',
    stipend: { amount: '', currency: 'INR' },
    eligibility: '',
    openings: 1,
    jobDescription: '',
    applyLink: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (internship) {
        const startDate = internship.internshipStartDate ? new Date(internship.internshipStartDate) : null;
        const endDate = internship.internshipEndDate ? new Date(internship.internshipEndDate) : null;
        let duration = '';
        if (startDate && endDate && endDate > startDate) {
            const durationInMs = endDate - startDate;
            const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
            duration = `${durationInDays} days`;
        }

        setFormData({
          role: internship.role || '',
          location: internship.location || '',
          internshipStartDate: internship.internshipStartDate ? new Date(internship.internshipStartDate).toISOString().split('T')[0] : '',
          internshipEndDate: internship.internshipEndDate ? new Date(internship.internshipEndDate).toISOString().split('T')[0] : '',
          duration: internship.duration || duration,
          type: internship.type || 'Full-time',
          skills: Array.isArray(internship.skills) ? internship.skills.join(', ') : '',
          stipend: {
            amount: internship.stipend?.amount || '',
            currency: internship.stipend?.currency || 'INR'
          },
          eligibility: internship.eligibility || '',
          openings: internship.openings || 1,
          jobDescription: internship.jobDescription || '',
          applyLink: internship.applyLink || ''
        });
      } else {
        setFormData(initialFormData);
      }
      setLocalError(null);
    }
  }, [internship, isOpen]);

  // Effect to calculate duration when dates change
  useEffect(() => {
    if (formData.internshipStartDate && formData.internshipEndDate) {
        const startDate = new Date(formData.internshipStartDate);
        const endDate = new Date(formData.internshipEndDate);

        if (endDate > startDate) {
            const durationInMilliseconds = endDate - startDate;
            const durationInDays = Math.ceil(durationInMilliseconds / (1000 * 60 * 60 * 24));
            setFormData(prev => ({ ...prev, duration: `${durationInDays} days` }));
            setLocalError(null); // Clear previous date errors
        } else if (endDate <= startDate) {
            setFormData(prev => ({ ...prev, duration: '' }));
            setLocalError("End Date must be after Start Date.");
        }
    } else {
        setFormData(prev => ({ ...prev, duration: '' }));
    }
  }, [formData.internshipStartDate, formData.internshipEndDate]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "stipend.amount" || name === "stipend.currency") {
        const [field, subfield] = name.split('.');
        setFormData(prev => ({
            ...prev,
            stipend: {
                ...prev.stipend,
                [subfield]: value
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.role.trim() || !formData.location.trim() || !formData.internshipStartDate || !formData.internshipEndDate) {
        setLocalError("Role, Location, Start Date, and End Date are required.");
        return;
    }

    if (new Date(formData.internshipEndDate) <= new Date(formData.internshipStartDate)) {
        setLocalError("End Date must be after Start Date.");
        return;
    }

    const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
    
    const { company, ...payloadWithoutCompany } = formData;
    const payload = {
      ...payloadWithoutCompany,
      skills: skillsArray,
      stipend: {
        amount: formData.stipend.amount ? Number(formData.stipend.amount) : undefined,
        currency: formData.stipend.currency
      },
      openings: Number(formData.openings),
      // Ensure date fields are correctly named
      internshipStartDate: formData.internshipStartDate,
      internshipEndDate: formData.internshipEndDate
    };
    
    onSave(payload);
  };

  const formFields = [
    { name: 'role', label: 'Role', type: 'text', required: true },
    { name: 'location', label: 'Location', type: 'text', required: true },
    { name: 'internshipStartDate', label: 'Start Date', type: 'date', required: true, min: new Date().toISOString().split('T')[0] },
    { name: 'internshipEndDate', label: 'End Date', type: 'date', required: true, min: formData.internshipStartDate || new Date().toISOString().split('T')[0] },
    { name: 'duration', label: 'Duration', type: 'text', disabled: true, placeholder: 'Auto-calculated' },
    { name: 'type', label: 'Internship Type', type: 'select', options: ['Full-time', 'Part-time', 'Remote'], required: true },
    { name: 'skills', label: 'Skills (comma-separated)', type: 'text' },
    // Stipend fields will be handled separately below
    { name: 'eligibility', label: 'Eligibility Criteria', type: 'textarea' },
    { name: 'openings', label: 'Number of Openings', type: 'number', required: true, min: 1 },
    { name: 'jobDescription', label: 'Job Description', type: 'textarea', required: true },
    { name: 'applyLink', label: 'Application Link/Email (Optional)', type: 'text' },
  ];
  
  const currentError = propError || localError;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">{internship ? 'Edit Internship' : 'Add New Internship'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <FaTimes size={24} />
          </button>
        </div>

        {currentError && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{currentError}</div>}

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {formFields.map(field => (
              <div key={field.name} className={`${field.type === 'textarea' || ['role', 'location', 'skills', 'applyLink'].includes(field.name) ? 'md:col-span-2' : ''}`}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {field.options.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    rows={field.name === 'jobDescription' ? 4 : 2}
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
                    disabled={field.disabled}
                    min={field.min}
                    placeholder={field.placeholder}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  />
                )}
              </div>
            ))}
            {/* Stipend Input Group */}
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stipend</label>
                <div className="flex items-center space-x-2">
                    <div className="w-2/3">
                        <input
                            type="number"
                            id="stipend.amount"
                            name="stipend.amount"
                            value={formData.stipend.amount}
                            onChange={handleChange}
                            min="0"
                            placeholder="e.g., 10000"
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div className="w-1/3">
                        <select
                            id="stipend.currency"
                            name="stipend.currency"
                            value={formData.stipend.currency}
                            onChange={handleChange}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="INR">INR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
            </div>
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
              ) : (internship ? 'Save Changes' : 'Add Internship')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InternshipFormModal;
