import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionData, setSubmissionData] = useState({
    assignmentId: '',
    replyText: '',
    file: null
  });
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);
  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/assignments/intern');
      console.log('Assignments response:', response.data);
      // Handle the new response format
      if (response.data.success) {
        setAssignments(response.data.data || []);
      } else {
        setAssignments([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('replyText', submissionData.replyText || '');
      if (submissionData.file) {
        formData.append('submissionFile', submissionData.file);
      }

      await axios.post(`/api/assignments/${submissionData.assignmentId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmissionResult({
        success: true,
        message: 'Assignment submitted successfully!'
      });
      setShowConfirmModal(true);
      setSubmissionData({ assignmentId: '', replyText: '', file: null });
      setShowSubmissionForm(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setSubmissionResult({
        success: false,
        message: error.response?.data?.message || 'Error submitting assignment. Please try again.'
      });
      setShowConfirmModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmissionForm = (assignmentId) => {
    setSubmissionData({ assignmentId, replyText: '', file: null });
    setShowSubmissionForm(true);
  };

  const downloadAssignment = async (assignmentId) => {
    try {
      const response = await axios.get(`/api/assignments/download/${assignmentId}`, {
        responseType: 'blob'
      });
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'assignment-file';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading assignment:', error);
      alert('Error downloading assignment file');
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">My Assignments</h1>

      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Submit Assignment</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Reply Text
                </label>
                <textarea
                  value={submissionData.replyText}
                  onChange={(e) =>
                    setSubmissionData({ ...submissionData, replyText: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md h-32"
                  placeholder="Enter your reply or notes about the assignment (optional)"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Upload File (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setSubmissionData({ ...submissionData, file: e.target.files[0] })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX, TXT, ZIP, RAR
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSubmissionForm(false)}
                  className="mr-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="text-center">
              {submissionResult?.success ? (
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
                  <p className="text-sm text-gray-500 mb-4">{submissionResult.message}</p>
                </div>
              ) : (
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
                  <p className="text-sm text-gray-500 mb-4">{submissionResult?.message}</p>
                </div>
              )}
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                  submissionResult?.success 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <p className="text-gray-600">No assignments yet.</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment._id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">                <div>
                  <h2 className="text-xl font-semibold">{assignment.title}</h2>
                  
                  <p className="text-gray-600">
                    Assigned by: {assignment.uploadedBy?.name || 'Unknown Mentor'}
                  </p>
                  <p className="text-gray-600">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    assignment.status === 'reviewed'
                      ? 'bg-green-100 text-green-800'
                      : assignment.status === 'submitted'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {assignment.status === 'pending' ? 'Pending' : 
                   assignment.status === 'submitted' ? 
                   (assignment.submission?.submittedLate ? 'Submitted Late' : 'Submitted') :
                   'Reviewed'}
                </span>
              </div>              <div className="prose max-w-none mb-4">
                <p className="text-gray-700">{assignment.description}</p>
                {assignment.fileUrl && (
                  <div className="mt-2">
                    <button
                      onClick={() => downloadAssignment(assignment._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      📎 Download Assignment File ({assignment.fileName})
                    </button>
                  </div>
                )}
              </div>
              {assignment.status === 'submitted' || assignment.status === 'reviewed' ? (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-semibold text-gray-700">Your Submission:</h3>
                  {assignment.submission?.replyText && (
                    <p className="text-gray-600 mt-2">{assignment.submission.replyText}</p>
                  )}
                  {assignment.submission?.fileName && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        📎 Submitted file: {assignment.submission.fileName}
                      </p>
                    </div>
                  )}
                  {assignment.submission?.submittedAt && (
                    <p className="text-sm text-gray-500 mt-2">
                      Submitted on: {new Date(assignment.submission.submittedAt).toLocaleString()}
                      {assignment.submission.submittedLate && (
                        <span className="text-red-500 ml-2">(Late submission)</span>
                      )}
                    </p>
                  )}
                  {assignment.submission?.feedback && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-700">Mentor Feedback:</h3>
                      <p className="text-gray-600 mt-2">{assignment.submission.feedback}</p>
                      {assignment.submission.grade && (
                        <p className="text-sm text-gray-500 mt-1">Grade: {assignment.submission.grade}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openSubmissionForm(assignment._id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Submit Assignment
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Assignments;