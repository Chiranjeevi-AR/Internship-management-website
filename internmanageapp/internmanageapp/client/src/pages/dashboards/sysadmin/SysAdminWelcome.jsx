import React from 'react';
import { useState } from 'react';
import axios from '../../../utils/axios';

const SysAdminWelcome = () => {
  // Add company registration form
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const res = await axios.post('/api/auth/register-company', { name: companyName, email: companyEmail });
      if (res.data && res.data.success) {
        setMessage('Company registered successfully!');
        setCompanyName(''); setCompanyEmail('');
      } else {
        setError(res.data?.message || 'Failed to register company');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register company');
    }
  };
  return (
    <div className="bg-white p-8 shadow-md rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, System Administrator!</h1>
      <p className="text-gray-600">
        Please use the sidebar navigation to access different administrative sections.
      </p>
      <ul className="list-disc list-inside text-gray-600 mt-4">
        <li><strong>Pending Approvals:</strong> Review and approve or reject new HR registrations.</li>
        <li><strong>Manage Internships:</strong> Oversee internship postings across all organizations.</li>
        <li><strong>Statistics:</strong> View platform-wide statistics and analytics.</li>
      </ul>
      <h2>Register a New Company</h2>
      <form onSubmit={handleRegisterCompany} style={{ marginBottom: 16 }}>
        <input type="text" placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} required style={{ marginRight: 8 }} />
        <input type="email" placeholder="Company Email (optional)" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} style={{ marginRight: 8 }} />
        <button type="submit">Register Company</button>
      </form>
      {message && <div style={{ color: 'green' }}>{message}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default SysAdminWelcome;
