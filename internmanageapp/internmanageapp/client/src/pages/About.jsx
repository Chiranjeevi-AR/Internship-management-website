import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef([]);

  useEffect(() => {
    setIsVisible(true);
    
    const observers = sectionRefs.current.map((ref, index) => {
      if (!ref) return null;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(index);
          }
        },
        { threshold: 0.3 }
      );
      
      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ),
      title: "Seamless Application Process",
      description: "Students can easily browse and apply for internships with our intuitive interface and streamlined application system."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Smart Talent Matching",
      description: "Our intelligent system connects the right students with the right opportunities based on skills, interests, and career goals."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Real-time Progress Tracking",
      description: "Monitor application status, track internship progress, and receive timely feedback throughout the entire journey."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h4a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V5a4 4 0 011-2.39M9 5a4 4 0 014 0m0 0v6a2 2 0 01-2 2H9" />
        </svg>
      ),
      title: "Streamlined Process Management",
      description: "Efficiently manage all internship processes including assignments, reports, project tracking, and documentation in one unified platform."
    }
  ];

  const values = [
    {
      title: "Innovation",
      description: "We continuously evolve our platform to meet the changing needs of the internship ecosystem.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Accessibility",
      description: "Making quality internship opportunities accessible to students from all backgrounds.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Excellence",
      description: "Committed to delivering the highest quality experience for all our platform users.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Transparency",
      description: "Building trust through clear communication and transparent processes.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <motion.section 
        className="relative bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 text-white py-24 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-4 -left-4 w-72 h-72 bg-white bg-opacity-10 rounded-full blur-3xl"
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/2 -right-4 w-96 h-96 bg-white bg-opacity-5 rounded-full blur-3xl"
            animate={{ 
              x: [0, -100, 0],
              y: [0, 50, 0],
              scale: [1, 0.8, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            ref={el => sectionRefs.current[0] = el}
            variants={staggerContainer}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-black mb-8 leading-tight"
              variants={fadeInUp}
              style={{ lineHeight: '1.1' }}
            >
              <span className="text-white">About </span>
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                TallyIntern
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl md:text-3xl font-light mb-12 text-blue-100 max-w-4xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Your Gateway to Meaningful Internship Opportunities
            </motion.p>
          </motion.div>
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section 
        className="py-24 bg-white"
        ref={el => sectionRefs.current[1] = el}
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-8 text-gray-900"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Our Mission
            </motion.h2>
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              TallyIntern is an advanced Internship Management Platform designed to streamline the entire internship ecosystem—from application and guide allocation to comprehensive feedback and progress tracking between students, mentors, and organizations.
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="py-24 bg-gradient-to-br from-gray-50 to-blue-50"
        ref={el => sectionRefs.current[2] = el}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Why Choose TallyIntern?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Our platform combines cutting-edge technology with user-centric design to create the ultimate internship experience.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed font-light">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section 
        className="py-24 bg-white"
        ref={el => sectionRefs.current[3] = el}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              The principles that guide everything we do and shape our commitment to excellence.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                className="group text-center"
                variants={fadeInUp}
                whileHover={{ y: -10 }}
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${value.gradient} rounded-3xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-light">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Approach Section */}
      <motion.section 
        className="py-24 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 text-white"
        ref={el => sectionRefs.current[4] = el}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Our Approach
              </h2>
            </motion.div>

            <motion.div 
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 md:p-12"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6 text-lg leading-relaxed font-light">
                <p>
                  At TallyIntern, we believe that internships are more than just work experience—they're a critical stepping stone in a student's journey toward their career goals. Our platform is designed with the needs of all stakeholders in mind, creating a seamless ecosystem where students can thrive, organizations can find the right talent, and educational institutions can monitor progress.
                </p>
                <p>
                  We continuously improve our platform based on feedback from interns, organizations, developers, and organizational admins (HR) to ensure we're meeting the evolving needs of the internship ecosystem. Our commitment is to make internships more accessible, meaningful, and rewarding for everyone involved.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section 
        className="py-24 bg-gray-900 text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Ready to Start Your Journey?
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto font-light"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of students and hundreds of companies who have already discovered the power of TallyIntern.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                window.location.href = '/internships';
                setTimeout(() => {
                  const internshipsSection = document.getElementById('internships-section');
                  if (internshipsSection) {
                    internshipsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
            >
              Browse Internships
            </motion.button>
            <motion.button
              className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('https://tallyinterncredits.vercel.app', '_blank')}
            >
              See Work Distribution
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default About;
