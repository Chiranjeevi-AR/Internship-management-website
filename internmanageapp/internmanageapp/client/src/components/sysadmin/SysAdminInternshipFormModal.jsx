import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from '../../utils/axios';

const SysAdminInternshipFormModal = ({ isOpen, onClose, onSave, internship, isLoading: propIsLoading, error: propError }) => {
  const initialFormData = {
    role: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    duration: '',
    type: 'Full-time',
    skills: '',
    stipend: {
      amount: '',
      currency: 'INR',
    },
    eligibility: '',
    openings: 1,
    jobDescription: '',
    applyLink: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [localError, setLocalError] = useState(null);
  // Remove company dropdown logic and revert to text input
  // Remove companyOptions, companyLoading, and related useEffect

  useEffect(() => {
    if (isOpen) {
      if (internship) {
        setFormData({
          role: internship.role || '',
          company: internship.company || '',
          location: internship.location || '',
          startDate: internship.startDate ? new Date(internship.startDate).toISOString().split('T')[0] : '',
          endDate: internship.endDate ? new Date(internship.endDate).toISOString().split('T')[0] : '',
          duration: internship.duration || '',
          type: internship.type || 'Full-time',
          skills: Array.isArray(internship.skills) ? internship.skills.join(', ') : '',
          stipend: {
            amount: internship.stipend?.amount || '',
            currency: internship.stipend?.currency || 'INR',
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

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end > start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setFormData(prev => ({ ...prev, duration: `${diffDays} days` }));
      } else {
        setFormData(prev => ({ ...prev, duration: '' }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  // Remove company dropdown logic and revert to text input
  // Remove companyOptions, companyLoading, and related useEffect

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'stipendAmount' || name === 'stipendCurrency') {
        const key = name === 'stipendAmount' ? 'amount' : 'currency';
        setFormData(prev => ({
            ...prev,
            stipend: { ...prev.stipend, [key]: value }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.role.trim() || !formData.company.trim() || !formData.location.trim() || !formData.startDate || !formData.endDate) {
        setLocalError("Role, Company, Location, Start Date, and End Date are required.");
        return;
    }

    const skillsArray = (formData.skills || '').split(',').map(skill => skill.trim()).filter(skill => skill);
    
    const payload = {
      ...formData,
      internshipStartDate: formData.startDate,
      internshipEndDate: formData.endDate,
      skills: skillsArray,
      stipend: {
          ...formData.stipend,
          amount: formData.stipend.amount ? Number(formData.stipend.amount) : undefined,
      },
      openings: Number(formData.openings)
    };
    delete payload.startDate;
    delete payload.endDate;
    
    // Debug log to verify company field
    console.log('Submitting internship:', payload);
    onSave(payload);
  };

  const formFields = [
    { name: 'role', label: 'Role', type: 'text', required: true, fullWidth: true },
    { name: 'company', label: 'Company', type: 'text', required: true, fullWidth: true },
    { name: 'location', label: 'Location', type: 'text', required: true, fullWidth: true },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true },
    { name: 'duration', label: 'Duration', type: 'text', disabled: true, fullWidth: true },
    { name: 'type', label: 'Internship Type', type: 'select', options: ['Full-time', 'Part-time', 'Remote'], required: true },
    { name: 'skills', label: 'Skills (comma-separated)', type: 'text', fullWidth: true },
    { name: 'stipendAmount', label: 'Stipend Amount', type: 'number', min: 0 },
    { name: 'stipendCurrency', label: 'Stipend Currency', type: 'select', options: ['INR', 'USD', 'EUR'] },
    { name: 'eligibility', label: 'Eligibility Criteria', type: 'textarea', fullWidth: true },
    { name: 'openings', label: 'Number of Openings', type: 'number', required: true, min: 1 },
    { name: 'jobDescription', label: 'Job Description', type: 'textarea', required: true, fullWidth: true },
    { name: 'applyLink', label: 'Application Link/Email (Optional)', type: 'text', fullWidth: true },
  ];
  
  const currentError = propError || localError;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
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
              <div key={field.name} className={`${field.fullWidth ? 'md:col-span-2' : ''}`}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.name === 'stipendCurrency' ? formData.stipend.currency : formData[field.name]}
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
                    value={field.name === 'stipendAmount' ? formData.stipend.amount : formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    disabled={field.disabled}
                    min={field.min}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
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
              ) : (internship ? 'Save Changes' : 'Add Internship')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SysAdminInternshipFormModal;
