import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import AdventureSection from "../components/AdventureSection";
import ChatBot from "../Components/Chatbot";

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

  const handleNavigate = (path) => {
    if (user) {
      navigate(path);
    } else {
      navigate('/login');
    }
  };

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
          src="https://cdn.pixabay.com/video/2019/09/19/27019-361107952_large.mp4"
        />
        <div className="absolute inset-0 bg-black opacity-50"></div>

        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 px-4 text-white"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-black">
            Every Second Counts - <span className="text-yellow-600"> get the right medical help when you need it most.</span>
          </h1>
          <p className="text-lg md:text-2xl mt-4 text-gray-300">
            Between a helpful co-writer and an easy-to-use image generator,
            <br /> Kahani AI offers the tools to unlock your creative potential.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => handleNavigate('/generate-images')}
              className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition transform duration-300"
            >
              Generate Images
            </button>
            <button
              onClick={() => handleNavigate('/story-generator')}
              className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition transform duration-300"
            >
              Create Stories
            </button>
            <button
              onClick={() => handleNavigate('/feedback')}
              className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition transform duration-300"
            >
              Enhance Stories
            </button>
          </div>
        </motion.div>
      </div>

      <AdventureSection />
      <ChatBot />
    </div>
  );
};

export default Home;
