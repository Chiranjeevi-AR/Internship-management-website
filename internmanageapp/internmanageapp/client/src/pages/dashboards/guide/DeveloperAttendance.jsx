import React, { useEffect, useState } from 'react';
import axios from '../../../utils/axios';
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaUsers, FaChartBar, FaFilter } from 'react-icons/fa';

const DeveloperAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedIntern, setSelectedIntern] = useState('all');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/attendance/assigned');
      setAttendanceRecords(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      setError('Failed to fetch attendance records.');
    }
    setLoading(false);
  };

  const markAttendance = async (attendanceId, status) => {
    setUpdatingId(attendanceId);
    try {
      await axios.put(`/api/attendance/${attendanceId}/status`, { status });
      await fetchAttendance();
    } catch (err) {
      alert('Failed to update attendance.');
    }
    setUpdatingId(null);
  };

  const internSummary = {};
  attendanceRecords.forEach((rec) => {
    if (!internSummary[rec.userId?._id]) {
      internSummary[rec.userId?._id] = {
        name: rec.userId?.name || '-',
        Present: summary[rec.userId?._id]?.Present || 0,
        Absent: summary[rec.userId?._id]?.Absent || 0,
      };
    }
  });

  // Filter attendance records based on selected intern
  const filteredAttendanceRecords = selectedIntern === 'all' 
    ? attendanceRecords 
    : attendanceRecords.filter(rec => rec.userId?._id === selectedIntern);

  // Get unique interns for the filter dropdown
  const uniqueInterns = Object.keys(internSummary).map(internId => ({
    id: internId,
    name: internSummary[internId].name
  }));

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex items-center mb-6">
          <FaUsers className="text-blue-600 text-3xl mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Intern Attendance Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage intern attendance records</p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-3 text-blue-600">
              <FaSpinner className="animate-spin text-2xl" />
              <span className="text-lg">Loading attendance records...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <FaChartBar className="text-green-600 text-xl mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Attendance Summary</h2>
              </div>
              
              {Object.values(internSummary).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaUsers className="mx-auto text-4xl mb-2 text-gray-300" />
                  <p>No intern attendance records found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {Object.values(internSummary).map((row, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 truncate">{row.name}</h3>
                        <FaUsers className="text-blue-500" />
                      </div>
                      <div className="flex justify-between items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <FaCheckCircle className="text-green-500 text-sm" />
                          <span className="text-sm text-gray-600">Present: <span className="font-semibold text-green-600">{row.Present}</span></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaTimesCircle className="text-red-500 text-sm" />
                          <span className="text-sm text-gray-600">Absent: <span className="font-semibold text-red-600">{row.Absent}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center mb-4 md:mb-0">
                  <FaCalendarAlt className="text-purple-600 text-xl mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">Daily Attendance Records</h2>
                </div>
                
                {/* Filter Dropdown */}
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-500" />
                  <select
                    value={selectedIntern}
                    onChange={(e) => setSelectedIntern(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 text-sm"
                  >
                    <option value="all">All Interns</option>
                    {uniqueInterns.map(intern => (
                      <option key={intern.id} value={intern.id}>
                        {intern.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {filteredAttendanceRecords.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FaCalendarAlt className="mx-auto text-4xl mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Attendance Records</h3>
                  <p className="text-gray-500">
                    {selectedIntern === 'all' 
                      ? 'No attendance records found for your assigned interns.' 
                      : 'No attendance records found for the selected intern.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing {filteredAttendanceRecords.length} of {attendanceRecords.length} records
                      {selectedIntern !== 'all' && (
                        <span className="ml-2 text-blue-600">
                          (filtered by: {uniqueInterns.find(intern => intern.id === selectedIntern)?.name})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaUsers className="mr-2" />
                              Intern
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaCalendarAlt className="mr-2" />
                              Date
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaClock className="mr-2" />
                              Check-In
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaClock className="mr-2" />
                              Check-Out
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAttendanceRecords.map((rec, index) => (
                          <tr key={rec._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {(rec.userId?.name || '-').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {rec.userId?.name || '-'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {rec.date ? new Date(rec.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {rec.checkIn ? (
                                <div className="flex items-center">
                                  <FaClock className="text-green-500 mr-2 text-xs" />
                                  {new Date(rec.checkIn).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {rec.checkOut ? (
                                <div className="flex items-center">
                                  <FaClock className="text-red-500 mr-2 text-xs" />
                                  {new Date(rec.checkOut).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                rec.status === 'Present' 
                                  ? 'bg-green-100 text-green-800' 
                                  : rec.status === 'Absent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {rec.status === 'Present' && <FaCheckCircle className="mr-1" />}
                                {rec.status === 'Absent' && <FaTimesCircle className="mr-1" />}
                                {rec.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                              <button
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                                  rec.status === 'Present' 
                                    ? 'bg-green-600 text-white cursor-default' 
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                                disabled={updatingId === rec._id}
                                onClick={() => markAttendance(rec._id, 'Present')}
                              >
                                {updatingId === rec._id ? (
                                  <FaSpinner className="animate-spin mr-1" />
                                ) : (
                                  <FaCheckCircle className="mr-1" />
                                )}
                                {rec.status === 'Present' ? 'Marked as Present' : 'Mark Present'}
                              </button>
                              <button
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mt-1 ${
                                  rec.status === 'Absent' 
                                    ? 'bg-red-600 text-white cursor-default' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                                disabled={updatingId === rec._id}
                                onClick={() => markAttendance(rec._id, 'Absent')}
                              >
                                {updatingId === rec._id ? (
                                  <FaSpinner className="animate-spin mr-1" />
                                ) : (
                                  <FaTimesCircle className="mr-1" />
                                )}
                                {rec.status === 'Absent' ? 'Marked as Absent' : 'Mark Absent'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeveloperAttendance;
