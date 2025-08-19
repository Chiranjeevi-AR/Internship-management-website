import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { FaPlus, FaDownload, FaFilePdf } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    projectAssignmentId: '',
    title: '',
    content: '',
    reportFile: null
  });
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchReports();
    fetchAssignments();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports/intern');
      setReports(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId || payload.id || payload._id;
      
      const response = await axios.get(`/api/project-assignments/intern/${userId}`);
      
      if (response.data.success) {
        setAssignments(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch assignments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('projectAssignmentId', formData.projectAssignmentId);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('reportFile', formData.reportFile);

      // --- THIS IS THE FIX ---
      // The URL is now correct according to your reportsRouter.js
      await axios.post('/api/reports/submit', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFormData({ projectAssignmentId: '', title: '', content: '', reportFile: null });
      setShowForm(false);
      fetchReports();
      toast.success('Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, reportFile: file });
    } else {
      toast.error('Please upload a PDF file');
      e.target.value = null;
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const response = await axios.get(`/api/reports/download/${reportId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Reports</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" />
          New Report
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Project
            </label>
            <select
              value={formData.projectAssignmentId}
              onChange={(e) => setFormData({ ...formData, projectAssignmentId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select a project</option>
              {assignments.map((assignment) => (
                <option key={assignment._id} value={assignment._id}>
                  {assignment.project?.name || 'Untitled Project'}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border rounded-md h-32"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Report File (PDF only)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Submit Report
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {reports.length === 0 ? (
          <p className="text-gray-600">No reports submitted yet.</p>
        ) : (
          reports.map((report) => (
            <div key={report._id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{report.title}</h2>
                  <p className="text-gray-600">
                    Project: {report.projectAssignment?.project?.name || 'Untitled Project'}
                  </p>
                  <p className="text-gray-600">
                    Submitted: {new Date(report.submissionDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(report._id)}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                    title="Download Report"
                  >
                    <FaDownload className="mr-1" />
                    Download PDF
                  </button>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      report.status === 'reviewed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700">{report.content}</p>
              </div>
              {report.mentorFeedback && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-semibold text-gray-700">Mentor Feedback:</h3>
                  <p className="text-gray-600 mt-2">{report.mentorFeedback}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
