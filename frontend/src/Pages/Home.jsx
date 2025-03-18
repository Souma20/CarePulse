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
              onClick={() => navigate('/story-generator')}
              className="bg-gradient-to-r from-orange-900 to-orange-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition duration-300"
            >
              Track Ambulance
            </button>
            <EmergencyButton className="bg-gradient-to-r from-red-900 to-red-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition duration-300" />
          </div>
        </motion.div>
      </div>

      {/* About Us Section */}
      <section className="py-20 bg-[#0d0e24] text-white text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1 }}
          className="text-4xl font-extrabold"
        >
          About Us
        </motion.h2>
        <div className="mt-8 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <p className="text-gray-300 text-lg md:w-1/2 leading-relaxed">
            Our mission is to bridge the gap between individuals and healthcare professionals during emergencies by providing instant access to medical resources, real-time assistance, and AI-powered diagnostics.
            <br /><br />
            With our AI-based healthcare platform, users can diagnose symptoms, book medical appointments, and connect with experts instantly. We strive to make emergency medical support more accessible and efficient.
          </p>
          <img src="/images/about.jpg" alt="About Us" className="w-full md:w-1/2 h-72 object-cover rounded-lg shadow-lg" />
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
          {[{
            title: "📖 First Aid Guides",
            description: "Step-by-step medical emergency instructions to help you act quickly.",
            img: "/images/first-aid.jpg"
          }, {
            title: "📅 Appointment Booking",
            description: "Instantly connect with nearby healthcare professionals and book appointments.",
            img: "/images/appointments.jpg"
          }, {
            title: "👥 Community Support",
            description: "Join discussions, share experiences, and get medical advice from professionals.",
            img: "/images/community.jpg"
          }, {
            title: "🛠 AI Symptom Checker",
            description: "Enter your symptoms and get AI-based preliminary diagnosis recommendations.",
            img: "/images/ai-checker.jpg"
          }, {
            title: "🚑 Emergency Call Assistance",
            description: "Connect instantly with local emergency responders in a crisis.",
            img: "/images/emergency-call.jpg"
          }, {
            title: "📡 Live Health Monitoring",
            description: "Track your vitals and receive alerts for potential health risks.",
            img: "/images/health-monitoring.jpg"
          }].map((feature, index) => (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-[#13142d] rounded-lg shadow-lg text-center"
            >
              <img src={feature.img} alt={feature.title} className="w-full h-56 object-cover rounded-lg mb-4" />
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
