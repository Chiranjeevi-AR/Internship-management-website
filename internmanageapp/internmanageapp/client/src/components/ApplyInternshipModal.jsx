import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';

const ApplyInternshipModal = ({ isOpen, onClose, internshipId, onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    linkedinId: '',
    githubId: '',
    codingPlatformsId: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const MAX_FILE_SIZE_MB = 4;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  // Fetch user profile data to auto-fill form
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isOpen) return;
      
      setIsProfileLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        const response = await axios.get('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success && response.data.data) {
          const userData = response.data.data;
          const newFormData = {
            fullName: userData.name || '',
            address: userData.address || '',
            linkedinId: userData.linkedin || '',
            githubId: userData.github || '',
            codingPlatformsId: '',
          };
          setFormData(newFormData);
        }
      } catch (error) {
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fullName: '',
        address: '',
        linkedinId: '',
        githubId: '',
        codingPlatformsId: '',
      });
      setResumeFile(null);
      setError('');
      setSuccessMessage('');
      setIsProfileLoading(false);
      if (document.getElementById('resume')) {
        document.getElementById('resume').value = null;
      }
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        setResumeFile(null);
        e.target.value = null;
        return;
      }
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed for resume.');
        setResumeFile(null);
        e.target.value = null;
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    } else {
      return; 
    }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!resumeFile) {
      setError('Resume is required.');
      setIsLoading(false);
      return;
    }

    const applicationData = new FormData();
    applicationData.append('internshipId', internshipId);
    applicationData.append('fullName', formData.fullName);
    applicationData.append('address', formData.address);
    applicationData.append('linkedinId', formData.linkedinId);
    applicationData.append('githubId', formData.githubId);
    applicationData.append('codingPlatformsId', formData.codingPlatformsId);
    applicationData.append('resume', resumeFile);

    const token = localStorage.getItem('token');
    if (!token) {
        setError('Authentication error. Please log in again.');
        setIsLoading(false);
        return;
    }

    try {
      const response = await axios.post('/api/applications/apply', applicationData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.data.success) {
        setSuccessMessage('Application submitted successfully!');
        setFormData({
          fullName: '',
          address: '',
          linkedinId: '',
          githubId: '',
          codingPlatformsId: '',
        });
        setResumeFile(null);
        if (document.getElementById('resume')) {
            document.getElementById('resume').value = null;
        }
        if (onSubmitSuccess) {
          onSubmitSuccess(response.data.data);
        }
        setTimeout(() => {
            onClose();
            setSuccessMessage('');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to submit application.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
      if (err.response?.status === 403 && err.response?.data?.reason === 'blacklisted') {
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Apply for Internship</h3>
          <form onSubmit={handleSubmit} className="mt-2 px-7 py-3 space-y-4 text-left">
            {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</p>}
            {successMessage && <p className="text-green-500 text-sm bg-green-100 p-2 rounded">{successMessage}</p>}
            
            {isProfileLoading && (
              <div className="text-center py-2">
                <p className="text-sm text-blue-600">Loading your profile data...</p>
              </div>
            )}
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                disabled={isProfileLoading}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                name="address"
                id="address"
                required
                rows="3"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your complete address"
                disabled={isProfileLoading}
              />
            </div>

            <div>
              <label htmlFor="resume" className="block text-sm font-medium text-gray-700">Resume (PDF, max {MAX_FILE_SIZE_MB}MB)</label>
              <input
                type="file"
                name="resume"
                id="resume"
                required
                accept="application/pdf"
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                onChange={handleFileChange}
              />
            </div>

            <div>
              <label htmlFor="linkedinId" className="block text-sm font-medium text-gray-700">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                name="linkedinId"
                id="linkedinId"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.linkedinId}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
                disabled={isProfileLoading}
              />
            </div>

            <div>
              <label htmlFor="githubId" className="block text-sm font-medium text-gray-700">
                GitHub Profile URL
              </label>
              <input
                type="url"
                name="githubId"
                id="githubId"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.githubId}
                onChange={handleChange}
                placeholder="https://github.com/yourprofile"
                disabled={isProfileLoading}
              />
            </div>

            <div>
              <label htmlFor="codingPlatformsId" className="block text-sm font-medium text-gray-700">LeetCode Profile URL</label>
              <input
                type="text"
                name="codingPlatformsId"
                id="codingPlatformsId"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.codingPlatformsId}
                onChange={handleChange}
                placeholder="your_username"
                disabled={isProfileLoading}
              />
            </div>

            <div className="items-center gap-2 mt-3 sm:flex">
              <button
                type="submit"
                disabled={isLoading || isProfileLoading}
                className="w-full mt-2 p-2.5 flex-1 text-white bg-indigo-600 rounded-md outline-none ring-offset-2 ring-indigo-600 focus:ring-2 disabled:bg-gray-400"
              >
                {isLoading ? 'Submitting...' : isProfileLoading ? 'Loading Profile...' : 'Submit Application'}
              </button>
              <button
                type="button"
                className="w-full mt-2 p-2.5 flex-1 text-gray-800 rounded-md outline-none border ring-offset-2 ring-indigo-600 focus:ring-2"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyInternshipModal;
