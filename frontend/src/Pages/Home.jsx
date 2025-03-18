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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsModalOpen(true);
        },
        () => {
          alert("Location access denied. Please enable it manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const emergencyEmails = {
    police: "shaalu5050@gmail.com",
    ambulance: "chakrabortysouma20@gmail.com",
    firebrigade: "faizshaikh29086@gmail.com",
  };

  const handleServiceSelection = (service) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const sendEmergencyEmail = () => {
    if (!location || selectedServices.length === 0) {
      alert("Please select at least one emergency service.");
      return;
    }
    selectedServices.forEach((service) => {
      const emailBody = `HELP! Emergency at Location:\nLatitude: ${location.latitude},\nLongitude: ${location.longitude}`;
      window.location.href = `mailto:${emergencyEmails[service]}?subject=Emergency Alert&body=${encodeURIComponent(emailBody)}`;
    });
    setIsModalOpen(false);
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
              Generate Images
            </button>
            <button
              onClick={() => navigate('/story-generator')}
              className="bg-gradient-to-r from-orange-900 to-orange-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition duration-300"
            >
              Create Stories
            </button>
            <button
              onClick={handleLocationRequest}
              className="bg-gradient-to-r from-red-900 to-red-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition transform duration-300"
            >
              Emergency
            </button>
          </div>
        </motion.div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg p-6 max-w-md w-full text-center shadow-lg"
          >
            <h2 className="text-xl font-bold mb-4">Select Emergency Service</h2>
            <div className="flex flex-col gap-3">
              {Object.keys(emergencyEmails).map((service) => (
                <label key={service} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service)}
                    onChange={() => handleServiceSelection(service)}
                  />
                  <span className="capitalize">{service}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded shadow"
              >
                Cancel
              </button>
              <button
                onClick={sendEmergencyEmail}
                className="bg-red-600 text-white px-4 py-2 rounded shadow"
              >
                Send Alert
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AdventureSection />
      <ChatBot />
    </div>
  );
};

export default Home;
