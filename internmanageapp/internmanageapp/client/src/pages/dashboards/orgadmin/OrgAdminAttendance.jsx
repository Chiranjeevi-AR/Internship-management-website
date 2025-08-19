import React, { useEffect, useState } from 'react';
import axios from '../../../utils/axios';
import { FaUserClock, FaCalendarCheck, FaChevronDown, FaSearch, FaClock, FaUserCheck, FaUserTimes, FaFilter } from 'react-icons/fa';

const OrgAdminAttendance = () => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIntern, setSelectedIntern] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/attendance/all');
      setRecords(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      setError('Failed to fetch attendance records.');
    }
    setLoading(false);
  };

  // Group summary by intern name
  const internSummary = {};
  records.forEach((rec) => {
    if (!internSummary[rec.userId?._id]) {
      internSummary[rec.userId?._id] = {
        id: rec.userId?._id,
        name: rec.userId?.name || '-',
        Present: summary[rec.userId?._id]?.Present || 0,
        Absent: summary[rec.userId?._id]?.Absent || 0,
      };
    }
  });

  const uniqueInterns = Object.values(internSummary);


  const filteredRecords = records.filter((record) => {
    const matchesIntern = selectedIntern === 'all' || record.userId?._id === selectedIntern;
    const matchesSearch = searchTerm === '' || 
      record.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.markedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesIntern && matchesSearch;
  });

  const filteredSummary = selectedIntern === 'all' 
    ? Object.values(internSummary)
    : Object.values(internSummary).filter(intern => intern.id === selectedIntern);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Present': 'bg-green-100 text-green-800 border-green-200',
      'Absent': 'bg-red-100 text-red-800 border-red-200',
      'Late': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Half Day': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSelectedInternName = () => {
    if (selectedIntern === 'all') return 'All Interns';
    const intern = uniqueInterns.find(intern => intern.id === selectedIntern);
    return intern ? intern.name : 'Select Intern';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaUserClock className="text-2xl text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
                <p className="text-gray-600 mt-1">Track and monitor intern attendance records</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Records</div>
              <div className="text-2xl font-bold text-blue-600">{filteredRecords.length}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  {/* Intern Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full sm:w-64 bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaUserCheck className="text-gray-400" />
                          <span className="text-gray-700 truncate">{getSelectedInternName()}</span>
                        </div>
                        <FaChevronDown className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div 
                          onClick={() => {
                            setSelectedIntern('all');
                            setIsDropdownOpen(false);
                          }}
                          className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors ${
                            selectedIntern === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <FaUserCheck className="text-blue-500" />
                            <span className="font-medium">All Interns</span>
                          </div>
                        </div>
                        
                        {uniqueInterns.map((intern) => (
                          <div
                            key={intern.id}
                            onClick={() => {
                              setSelectedIntern(intern.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-t border-gray-100 ${
                              selectedIntern === intern.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {intern.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{intern.name}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {intern.Present + intern.Absent} records
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {filteredSummary.map((intern) => (
                <div key={intern.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {intern.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total Days</div>
                      <div className="text-xl font-bold text-gray-900">{intern.Present + intern.Absent}</div>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-3 truncate">{intern.name}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FaUserCheck className="text-green-500 text-sm" />
                        <span className="text-sm text-gray-600">Present</span>
                      </div>
                      <span className="font-semibold text-green-600">{intern.Present}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FaUserTimes className="text-red-500 text-sm" />
                        <span className="text-sm text-gray-600">Absent</span>
                      </div>
                      <span className="font-semibold text-red-600">{intern.Absent}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Attendance Rate</span>
                        <span className="font-semibold text-blue-600">
                          {intern.Present + intern.Absent > 0 
                            ? Math.round((intern.Present / (intern.Present + intern.Absent)) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <FaCalendarCheck className="text-blue-600" />
                    <span>Attendance Records</span>
                  </h3>
                  <div className="text-sm text-gray-500">
                    Showing {filteredRecords.length} of {records.length} records
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intern</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <FaUserClock className="mx-auto text-4xl mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No attendance records found</p>
                            <p className="text-sm">Try adjusting your filters or search term</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {(record.userId?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {record.userId?.name || '-'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.date ? new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.checkIn ? (
                              <div className="flex items-center space-x-1">
                                <FaClock className="text-green-500" />
                                <span>{new Date(record.checkIn).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.checkOut ? (
                              <div className="flex items-center space-x-1">
                                <FaClock className="text-red-500" />
                                <span>{new Date(record.checkOut).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.markedBy?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.markedAt ? new Date(record.markedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrgAdminAttendance;
