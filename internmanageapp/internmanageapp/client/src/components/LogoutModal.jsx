import React from 'react';

const LogoutModal = ({ open, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-fadeIn">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Logout</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to logout? You will be signed out of your account.</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
