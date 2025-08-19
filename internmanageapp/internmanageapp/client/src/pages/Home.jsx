import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axios'; // Changed from axios to axiosInstance
import CompanyCard from '../components/CompanyCard';
import { API_BASE_URL } from '../config/api';
import ApplyInternshipModal from '../components/ApplyInternshipModal'; // Import the modal
import InternshipDetailsModal from '../components/modals/InternshipDetailsModal'; // Import the new details modal
import LoginRequiredModal from '../components/modals/LoginRequiredModal'; // Import the login required modal
import { getUserPayloadFromToken } from '../utils/authUtils'; // Import utility

const Home = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalInternships: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 4
  });
  const [isModalOpen, setIsModalOpen] = useState(false); // State for apply modal
  const [selectedInternshipId, setSelectedInternshipId] = useState(null); // State for selected internship
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); // State for details modal
  const [selectedInternship, setSelectedInternship] = useState(null); // State for selected internship details
  const [isLoginRequiredModalOpen, setIsLoginRequiredModalOpen] = useState(false); // State for login required modal
  const [isTransitioning, setIsTransitioning] = useState(false); // State for animation
  const [appliedInternshipIds, setAppliedInternshipIds] = useState(new Set()); // State for applied internships
  const [typedText, setTypedText] = useState(''); // State for typing effect
  const [showCursor, setShowCursor] = useState(true); // State for cursor blinking
  const [isHeroVisible, setIsHeroVisible] = useState(false); // State for hero animation
  const userType = localStorage.getItem('userType'); // Get user type
  const token = localStorage.getItem('token'); // Get token to check if user is logged in
  const heroRef = useRef(null);

  // Typing effect configuration
  const fullText = 'Simplify Your Internship Journey';
  const typingSpeed = 100;

  // Typing effect
  useEffect(() => {
    setIsHeroVisible(true);
    
    const timer = setTimeout(() => {
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, typingSpeed);

      return () => clearInterval(typeInterval);
    }, 800); // Delay before typing starts

    // Cursor blinking effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(cursorInterval);
    };
  }, []);

  // Particle animation effect
  useEffect(() => {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      let currentUserId = null;

      if (userType === 'candidate') {
        const payload = getUserPayloadFromToken();
        if (payload && payload.userId) {
          currentUserId = payload.userId;
        }
      }

      try {
        // Fetch internships
        const response = await axiosInstance.get(`/api/internships/front-page/${currentPage}`);
        
        if (response.data.success) {
          setInternships(response.data.data);
          setPagination(response.data.pagination);
        } else {
          setError("Failed to fetch internships");
        }

        // Fetch applied internships if user is a candidate
        if (userType === 'candidate' && currentUserId) {
          try {
            const appliedResponse = await axiosInstance.get(`/api/applications/candidate/${currentUserId}/applied-ids`);
            if (appliedResponse.data.success && Array.isArray(appliedResponse.data.data)) {
              setAppliedInternshipIds(new Set(appliedResponse.data.data));
            } else {
              console.warn('Could not fetch applied internship IDs:', appliedResponse.data.message);
              setAppliedInternshipIds(new Set());
            }
          } catch (appErr) {
            console.error('Error fetching applied internships:', appErr);
            setAppliedInternshipIds(new Set());
          }
        }

      } catch (err) {
        setError("An error occurred while fetching internships");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, userType]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && !isTransitioning) {
      setIsTransitioning(true);
      
      // Add a small delay for the fade-out animation
      setTimeout(() => {
        setCurrentPage(newPage);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 150); // Half of the transition duration
      }, 150);
    }
  };

  // Modal handlers
  const handleOpenModal = (internshipId, event) => {
    if (event) {
      event.preventDefault();
    }
    if (userType === 'candidate') {
      setSelectedInternshipId(internshipId);
      setIsModalOpen(true);
    } else {
      // User not logged in or not a candidate
      setIsLoginRequiredModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInternshipId(null);
  };

  const handleViewDetails = (internship) => {
    setSelectedInternship(internship);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedInternship(null);
  };

  const handleLoginRequired = () => {
    setIsLoginRequiredModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginRequiredModalOpen(false);
  };

  const handleApplicationSuccess = (applicationData) => {
    // Optional: Update UI or show success message
    // Modal handles its own closing and success message for now
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white py-20 overflow-hidden">
        {/* Animated background canvas */}
        <canvas 
          id="particles-canvas" 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        ></canvas>
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400 rounded-full opacity-20 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-pink-400 rounded-lg opacity-20 animate-pulse" style={{animationDelay: '1s', animationDuration: '2s'}}></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-yellow-400 rounded-full opacity-20 animate-ping" style={{animationDelay: '2s', animationDuration: '4s'}}></div>
          <div className="absolute bottom-40 right-10 w-24 h-24 bg-green-400 rounded-lg opacity-20 animate-spin" style={{animationDelay: '0.5s', animationDuration: '8s'}}></div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center transform transition-all duration-1000 ease-out ${
            isHeroVisible 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-20 opacity-0'
          }`}>
            {/* Main heading with typing effect */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent leading-relaxed pb-4">
                {typedText}
                <span className={`inline-block w-1 h-16 bg-white ml-2 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}></span>
              </h1>
            </div>
            
            {/* Subtitle with delayed animation */}
            <div className={`transform transition-all duration-1000 ease-out delay-1000 ${
              isHeroVisible 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-20 opacity-0'
            }`}>
              <p className="text-xl md:text-2xl lg:text-3xl mb-12 text-blue-100 font-light leading-relaxed pb-4">
                Explore, Apply, and Manage Internships 
                <span className="block mt-4 bg-gradient-to-r from-pink-300 to-yellow-300 bg-clip-text text-transparent font-medium pb-2">
                  Seamlessly
                </span>
              </p>
            </div>

            {/* Call-to-action button with staggered animation */}
            <div className={`flex justify-center items-center transform transition-all duration-1000 ease-out delay-1500 ${
              isHeroVisible 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-20 opacity-0'
            }`}>
              <button 
                onClick={() => {
                  document.getElementById('featured-section').scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
                className="group px-8 py-4 border-2 border-white/30 hover:border-white text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <span className="flex items-center gap-2">
                  Explore Opportunities
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator with bounce animation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Internship Highlights Section */}
      <section id="featured-section" className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#3B82F6" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header with reveal animation */}
          <div className="text-center mb-16">
            <div className="inline-block">
              <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm mb-2 block">
                Featured Opportunities
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-relaxed pb-4">
                Find Your Perfect 
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-2">
                  Internship Match
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed pb-4">
                Discover amazing opportunities from top companies and kickstart your career journey
              </p>
            </div>
            
            {/* Decorative line */}
            <div className="flex justify-center mt-8">
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                {/* Loading spinner with modern design */}
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-spin" style={{animationDelay: '0.1s', animationDirection: 'reverse'}}></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button 
                  onClick={() => setCurrentPage(1)} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Carousel Container with enhanced design */}
              <div className="relative">
                {/* Arrow Buttons with modern styling */}
                {pagination.totalPages > 1 && (
                  <>
                    {/* Left Arrow */}
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrevPage || isTransitioning}
                      className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 rounded-full shadow-xl transition-all duration-300 backdrop-blur-sm ${
                        pagination.hasPrevPage && !isTransitioning
                          ? 'bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 border-2 border-white/50 hover:border-blue-300 hover:scale-110 hover:shadow-2xl' 
                          : 'bg-gray-100/50 text-gray-400 cursor-not-allowed border-2 border-gray-200/50'
                      }`}
                      style={{ marginLeft: '-28px' }}
                    >
                      <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Right Arrow */}
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage || isTransitioning}
                      className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 rounded-full shadow-xl transition-all duration-300 backdrop-blur-sm ${
                        pagination.hasNextPage && !isTransitioning
                          ? 'bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 border-2 border-white/50 hover:border-blue-300 hover:scale-110 hover:shadow-2xl' 
                          : 'bg-gray-100/50 text-gray-400 cursor-not-allowed border-2 border-gray-200/50'
                      }`}
                      style={{ marginRight: '-28px' }}
                    >
                      <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Internships Grid with enhanced animations */}
                <div className="px-12">
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500 ease-out transform ${
                    isTransitioning ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'
                  }`}>
                    {internships.length > 0 ? (
                      internships.map((internship, index) => (
                        <div
                          key={internship._id}
                          className={`transition-all duration-500 ease-out transform hover:scale-105 ${
                            isTransitioning 
                              ? 'opacity-0 translate-y-8 rotate-1' 
                              : 'opacity-100 translate-y-0 rotate-0'
                          }`}
                          style={{ 
                            transitionDelay: `${index * 150}ms`,
                            filter: isTransitioning ? 'blur(2px)' : 'blur(0px)'
                          }}
                        >
                          <div className="group relative">
                            {/* Hover glow effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-25 transition-opacity duration-300"></div>
                            <div className="relative">
                              <CompanyCard 
                                internship={{
                                  ...internship,
                                  id: internship._id,
                                  companyName: internship.company,
                                  domain: internship.type,
                                }} 
                                userType={userType}
                                onApplyNow={(id, event) => handleOpenModal(id, event)}
                                onViewDetails={handleViewDetails}
                                isApplied={appliedInternshipIds.has(internship._id)}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-16">
                        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Internships Available</h3>
                          <p className="text-gray-600">Check back soon for new opportunities!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Enhanced Page Indicator Dots */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-3 mt-12">
                  <span className="text-sm text-gray-500 font-medium">
                    {currentPage} of {pagination.totalPages}
                  </span>
                  <div className="flex space-x-2">
                    {[...Array(pagination.totalPages).keys()].map(page => (
                      <button 
                        key={page + 1}
                        onClick={() => handlePageChange(page + 1)}
                        disabled={isTransitioning}
                        className={`transition-all duration-300 transform ${
                          currentPage === page + 1 
                            ? 'w-8 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full scale-110' 
                            : isTransitioning
                            ? 'w-3 h-3 bg-gray-300 rounded-full cursor-not-allowed'
                            : 'w-3 h-3 bg-gray-300 hover:bg-gray-400 rounded-full hover:scale-125 cursor-pointer'
                        }`}
                        aria-label={`Go to page ${page + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      

      {/* Apply Internship Modal */}
      {isModalOpen && selectedInternshipId && (
        <ApplyInternshipModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          internshipId={selectedInternshipId}
          onSubmitSuccess={handleApplicationSuccess}
        />
      )}

      {/* Internship Details Modal */}
      {isDetailsModalOpen && selectedInternship && (
        <InternshipDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          internship={selectedInternship}
          userType={userType}
          onApply={handleOpenModal}
          isApplied={appliedInternshipIds.has(selectedInternship._id)}
        />
      )}

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={isLoginRequiredModalOpen}
        onClose={handleCloseLoginModal}
      />
    </div>
  );
};

export default Home;