import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import ChatBot from "../Components/Chatbot";
import EmergencyButton from "../Components/EmergencyButton";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0a0b1d]">
      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center text-center min-h-screen overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          src="https://cdn.pixabay.com/video/2017/03/20/8449-209292163_large.mp4"
        />
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 px-4 text-white"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold">
            Every Second Counts - <span className="text-yellow-400"> get the right medical help when you need it most.</span>
          </h1>
          <p className="text-lg md:text-2xl mt-4 text-gray-300">
            Redefining emergency response with speed, precision, and technology.
            <br /> Smart healthcare, real-time assistance—because technology should save lives.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/generate-images')}
              className="bg-gradient-to-r from-yellow-900 to-yellow-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition duration-300"
            >
              AI Diagnosis
            </button>
            <button
              onClick={() => navigate('/ambulance-tracker')}
              className="bg-gradient-to-r from-orange-900 to-orange-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition duration-300"
            >
              Track Ambulance
            </button>
            <EmergencyButton className="bg-gradient-to-r from-red-900 to-red-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition duration-300" />
          </div>
        </motion.div>
      </div>

      {/* About Us Section */}
      <section className="py-24 bg-gradient-to-b from-[#0d0e24] to-[#131438] text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent inline-block">
              About Us
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4"></div>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              variants={fadeIn}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold text-blue-300">Our Mission</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                We bridge the gap between individuals and healthcare professionals during emergencies by providing instant access to medical resources, real-time assistance, and AI-powered diagnostics.
              </p>
              
              <div className="pt-4">
                <h3 className="text-2xl font-semibold text-blue-300">What We Offer</h3>
                <ul className="mt-4 space-y-4">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-md bg-blue-900/30 p-2 mr-3">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="text-gray-300">AI-powered symptom diagnosis and preliminary assessments</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-md bg-blue-900/30 p-2 mr-3">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="text-gray-300">Seamless appointment booking with healthcare specialists</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center rounded-md bg-blue-900/30 p-2 mr-3">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="text-gray-300">24/7 emergency assistance and medical guidance</span>
                  </li>
                </ul>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="pt-6"
              >
                <a href="/our-story" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-white font-medium group">
                  <span>Learn More About Our Story</span>
                  <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              variants={fadeIn}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-50 blur-xl"></div>
              <div className="relative overflow-hidden rounded-2xl border border-gray-700">
                <img 
                  src="/images/about.jpg" 
                  alt="AI Healthcare Platform" 
                  className="w-full h-96 object-cover transform transition duration-700 hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-300">Available 24/7</span>
                  </div>
                  <p className="text-xl font-semibold text-white mt-2">
                    Making healthcare accessible anytime, anywhere
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-[#1a1b3a] p-4 rounded-lg">
                  <h4 className="text-3xl font-bold text-blue-400">95%</h4>
                  <p className="text-sm text-gray-400">Accurate Diagnosis</p>
                </div>
                <div className="bg-[#1a1b3a] p-4 rounded-lg">
                  <h4 className="text-3xl font-bold text-blue-400">24/7</h4>
                  <p className="text-sm text-gray-400">Support Available</p>
                </div>
                <div className="bg-[#1a1b3a] p-4 rounded-lg">
                  <h4 className="text-3xl font-bold text-blue-400">500k+</h4>
                  <p className="text-sm text-gray-400">Users Helped</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0a0b1d] text-white text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1 }}
          className="text-4xl font-extrabold"
        >
          Our Features
        </motion.h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-6">
          {[
            {
              title: "📖 First Aid Guides",
              description: "Step-by-step medical emergency instructions to help you act quickly.",
              img: "/images/first-aid.png"
            },
            {
              title: "📅 Appointment Booking",
              description: "Instantly connect with nearby healthcare professionals and book appointments.",
              img: "/images/appointment.png"
            },
            {
              title: "👥 Community Support",
              description: "Join discussions, share experiences, and get medical advice from professionals.",
              img: "/images/community.png"
            },
            {
              title: "🛠 AI Symptom Checker",
              description: "Enter your symptoms and get AI-based preliminary diagnosis recommendations.",
              img: "/images/ai-symptom.png"
            },
            {
              title: "🚑 Emergency Call Assistance",
              description: "Connect instantly with local emergency responders in a crisis.",
              img: "/images/emergency-call.png"
            },
            {
              title: "📡 Live Health Monitoring",
              description: "Track your vitals and receive alerts for potential health risks.",
              img: "/images/live-health.png"
            }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-[#13142d] rounded-lg shadow-lg text-center transition-all"
            >
              <img src={feature.img} alt={feature.title} className="w-full h-56 object-cover rounded-lg mb-4 transform transition duration-700 hover:scale-105" />
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      <ChatBot />
    </div>
  );
};

export default Home;
