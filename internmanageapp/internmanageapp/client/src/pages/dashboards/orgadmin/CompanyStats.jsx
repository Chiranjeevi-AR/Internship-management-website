import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';

const CompanyStats = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/stats/company-overview');
                if (response.data && response.data.success) {
                    setStats(response.data.data);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch company statistics.');
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message || 'Could not load company statistics.';
                setError(errorMessage);
                toast.error(errorMessage);
            }
            setIsLoading(false);
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="p-4"><p className="text-center text-gray-500">Loading statistics...</p></div>;
    }

    if (error) {
        return <div className="p-4"><p className="text-center text-red-500">Error: {error}</p></div>;
    }

    if (!stats) {
        return <div className="p-4"><p className="text-center text-gray-500">No statistics available at the moment.</p></div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 text-center">Company Statistics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 ease-in-out">
                    <h2 className="text-lg font-semibold text-indigo-600 mb-2">Active Interns</h2>
                    <p className="text-4xl font-bold text-gray-700">{stats.activeInterns ?? 'N/A'}</p>
                </div>
                <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 ease-in-out">
                    <h2 className="text-lg font-semibold text-teal-600 mb-2">Active Developers</h2>
                    <p className="text-4xl font-bold text-gray-700">{stats.activeDevelopers ?? 'N/A'}</p>
                </div>
                <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 ease-in-out">
                    <h2 className="text-lg font-semibold text-pink-600 mb-2">Total Applicants</h2>
                    <p className="text-4xl font-bold text-gray-700">{stats.totalApplicants ?? 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};

export default CompanyStats;
