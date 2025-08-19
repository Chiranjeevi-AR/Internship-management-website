import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">TallyIntern</h3>
            <p className="text-gray-300">
              Connecting students with meaningful internship opportunities and helping organizations find talented interns.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-white">Home</a></li>
              <li><a href="/internships" className="text-gray-300 hover:text-white">Internships</a></li>
              <li><a href="/about" className="text-gray-300 hover:text-white">About</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <p className="text-gray-300">Email: contact@tallysolutions.com</p>
            <p className="text-gray-300">Phone: +91 123-456-7890</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-300">&copy; {new Date().getFullYear()} TallyIntern. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 