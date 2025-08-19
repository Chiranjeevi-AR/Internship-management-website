import React, { useEffect, useState } from 'react';
import api from '../../utils/axios';
import { getTodayLocalDate } from '../../utils/dateUtils';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  CalendarDaysIcon,
  ChartBarIcon,
  UserIcon 
} from '@heroicons/react/24/outline';

const InternDashboard = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkInDisabled, setCheckInDisabled] = useState(false);
  const [checkOutDisabled, setCheckOutDisabled] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/attendance/my');
      setAttendance(res.data.data);
      const todayStr = getTodayLocalDate();
      
      const todayRec = res.data.data.find(r => {
        const recordDate = new Date(r.date).toLocaleDateString('en-CA');
        return recordDate === todayStr;
      });
      
      setTodayRecord(todayRec);
      setCheckInDisabled(!!(todayRec && todayRec.checkIn));
      setCheckOutDisabled(!!(todayRec && todayRec.checkOut));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance');
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/attendance/check-in', { location: '' });
      await fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/api/attendance/check-out', { location: '' });
      await fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'text-green-600 bg-green-100';
      case 'Absent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present': return <CheckCircleIcon className="h-4 w-4" />;
      case 'Absent': return <XCircleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const calculateStats = () => {
    const present = attendance.filter(r => r.status === 'Present').length;
    const absent = attendance.filter(r => r.status === 'Absent').length;
    const total = attendance.length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    return { present, absent, total, percentage };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Dashboard</h1>
          <p className="text-gray-600">Track your daily attendance and manage check-ins</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Today's Status Card */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarDaysIcon className="h-6 w-6 mr-2 text-blue-600" />
              Today's Status
            </h2>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Check In</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {todayRecord?.checkIn 
                      ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Not checked in'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Check Out</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {todayRecord?.checkOut 
                      ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Not checked out'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {todayRecord?.totalHours ? `${todayRecord.totalHours.toFixed(2)}h` : '0h'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                checkInDisabled || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
              }`}
              onClick={handleCheckIn}
              disabled={checkInDisabled || loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {checkInDisabled ? 'Already Checked In' : 'Check In'}
                </div>
              )}
            </button>

            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                checkOutDisabled || loading || !checkInDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
              }`}
              onClick={handleCheckOut}
              disabled={checkOutDisabled || loading || !checkInDisabled}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  {checkOutDisabled ? 'Already Checked Out' : 
                   !checkInDisabled ? 'Check In First' : 'Check Out'}
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance %</p>
                <p className="text-2xl font-bold text-gray-900">{stats.percentage}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
              Attendance Records
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendance.map((rec) => (
                    <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(rec.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rec.checkIn ? (
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2 text-green-500" />
                            {new Date(rec.checkIn).toLocaleTimeString([], { 
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
                            <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
                            {new Date(rec.checkOut).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rec.totalHours ? (
                          <span className="font-medium">{rec.totalHours.toFixed(2)}h</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rec.status)}`}>
                          {getStatusIcon(rec.status)}
                          <span className="ml-1">{rec.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternDashboard;
