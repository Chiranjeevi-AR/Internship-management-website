import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({});
  const [picFile, setPicFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/profile');
      setProfile(res.data.data);
      setForm(res.data.data);
    } catch (err) {
      setError('Failed to fetch profile.');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePicChange = (e) => {
    setPicFile(e.target.files[0]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let profilePicUrl = form.profilePic;
      if (picFile) {
        const data = new FormData();
        data.append('file', picFile);
        const uploadRes = await axios.post('/api/profile/picture', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        profilePicUrl = uploadRes.data.url;
      }
      const res = await axios.put('/api/profile', { ...form, profilePic: profilePicUrl });
      setProfile(res.data.data);
      setPicFile(null);
    } catch (err) {
      setError('Failed to update profile.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-purple-100 p-8 rounded-2xl shadow-lg mt-8 animate-fade-in">
      <div className="flex items-center mb-6 gap-6">
        <div className="relative">
          <img
            src={profile.profilePic || '/default-profile.png'}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border-4 border-blue-400 shadow-lg"
          />
          <input type="file" accept="image/*" onChange={handlePicChange} className="absolute left-0 top-24 w-full text-xs" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-blue-900 mb-1">{profile.name}</h2>
          <div className="text-gray-600 text-lg">{profile.type?.charAt(0).toUpperCase() + profile.type?.slice(1)}</div>
          <div className="text-gray-500 text-sm">{profile.email}</div>
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-blue-800">Phone</label>
            <input
              name="phone"
              value={form.phone || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-300"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block font-semibold text-blue-800">Address</label>
            <input
              name="address"
              value={form.address || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-300"
              placeholder="Address"
            />
          </div>
          <div>
            <label className="block font-semibold text-blue-800">LinkedIn</label>
            <input
              name="linkedin"
              value={form.linkedin || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-300"
              placeholder="LinkedIn profile URL"
            />
          </div>
          <div>
            <label className="block font-semibold text-blue-800">GitHub</label>
            <input
              name="github"
              value={form.github || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-300"
              placeholder="GitHub profile URL"
            />
          </div>
          {profile.type === 'intern' && (
            <>
              <div>
                <label className="block font-semibold text-blue-800">College</label>
                <input
                  name="college"
                  value={form.college || ''}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-300"
                  placeholder="College name"
                />
              </div>
              <div>
                <label className="block font-semibold text-blue-800">Branch</label>
                <input
                  name="branch"
                  value={form.branch || ''}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-300"
                  placeholder="Branch"
                />
              </div>
              <div>
                <label className="block font-semibold text-blue-800">Company</label>
                <input
                  name="company"
                  value={form.company || ''}
                  className="border rounded px-3 py-2 w-full bg-gray-100"
                  placeholder="Company name"
                  disabled
                />
              </div>
            </>
          )}
          {(profile.type === 'developer' || profile.type === 'admin' || profile.type === 'hr' || profile.type === 'orgadmin') && (
            <>
              <div>
                <label className="block font-semibold text-blue-800">Role</label>
                <input
                  name="type"
                  value={form.type || ''}
                  className="border rounded px-3 py-2 w-full bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block font-semibold text-blue-800">Company</label>
                <input
                  name="company"
                  value={form.company || ''}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full bg-gray-100 focus:ring-2 focus:ring-blue-300"
                  placeholder="Company name"
                  disabled
                />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
