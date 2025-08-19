import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../../utils/axios';
import { FaDownload, FaSpinner, FaCalendar, FaUser, FaFileAlt, FaComment, FaCheck, FaTimes, FaSync, FaRegSadTear } from 'react-icons/fa';

const FeedbackModal = ({ report, onClose, onFeedbackSubmit }) => {
    const [feedback, setFeedback] = useState(report?.mentorFeedback || '');
    const [loading, setLoading] = useState(false);

    const submitFeedback = async () => {
        if (!feedback.trim()) {
            toast.error('Please provide feedback');
            return;
        }
        setLoading(true);
        try {
            const response = await api.patch(`/api/reports/${report._id}/feedback`, {
                feedback: feedback.trim()
            });

            if (response.data.success) {
                toast.success('Feedback submitted successfully');
                onFeedbackSubmit(report._id, feedback.trim());
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
                <h2 className="text-2xl font-bold mb-4">
                    Feedback for "{report.title}"
                </h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Feedback *
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows="5"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Provide constructive feedback on the intern's report..."
                        required
                    />
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submitFeedback}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                    >
                        {loading && <FaSpinner className="animate-spin mr-2" />}
                        Submit Feedback
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeveloperReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/reports/mentor');
            if (response.data.success) {
                setReports(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);
    
    const handleDownload = async (reportId, fileName) => {
        try {
            const response = await api.get(`/api/reports/download/${reportId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to download report');
        }
    };

    const handleOpenFeedbackModal = (report) => {
        setSelectedReport(report);
        setFeedbackModalOpen(true);
    };

    const handleFeedbackSubmit = (reportId, newFeedback) => {
        setReports(prevReports =>
            prevReports.map(report =>
                report._id === reportId
                    ? { ...report, mentorFeedback: newFeedback, status: 'reviewed' }
                    : report
            )
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'reviewed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto p-6">
            {feedbackModalOpen && selectedReport && (
                <FeedbackModal
                    report={selectedReport}
                    onClose={() => setFeedbackModalOpen(false)}
                    onFeedbackSubmit={handleFeedbackSubmit}
                />
            )}
            <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Intern Reports</h1>
                    <button onClick={fetchReports} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300" title="Refresh List">
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <FaSpinner className="animate-spin text-3xl text-blue-600" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                        <FaRegSadTear className="mx-auto text-6xl text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Reports Submitted</h3>
                        <p className="text-gray-500">Reports submitted by your interns will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reports.map((report) => (
                            <div key={report._id} className="bg-gray-50 rounded-lg p-6 border hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{report.title}</h3>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                            <div className="flex items-center"><FaUser className="mr-1" /><span>{report.intern?.name || 'Unknown Intern'}</span></div>
                                            <div className="flex items-center"><FaFileAlt className="mr-1" /><span>Project: {report.projectAssignment?.projectId?.name || 'N/A'}</span></div>
                                            <div className="flex items-center"><FaCalendar className="mr-1" /><span>{new Date(report.submissionDate).toLocaleDateString()}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-2 ml-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                            {report.status.toUpperCase()}
                                        </span>
                                        <button
                                            onClick={() => handleDownload(report._id, report.reportFile)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition-colors flex items-center"
                                        >
                                            <FaDownload className="mr-2" /> Download
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-4">{report.content}</p>
                                {report.mentorFeedback ? (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <h4 className="font-medium text-green-800 mb-1">Your Feedback:</h4>
                                        <p className="text-green-700 text-sm italic">"{report.mentorFeedback}"</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleOpenFeedbackModal(report)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors flex items-center"
                                    >
                                        <FaComment className="mr-2" /> Provide Feedback
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeveloperReports;
