import { useState } from "react";
import { motion } from "framer-motion";

const EmergencyButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [location, setLocation] = useState(null);

  const emergencyEmails = {
    police: "shaalu5050@gmail.com",
    ambulance: "chakrabortysouma20@gmail.com",
    firebrigade: "faizshaikh29086@gmail.com",
  };

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
        (error) => {
          alert("Location access denied. Please enable it manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
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
      const emailBody = `HELP! Emergency at Location: \nLatitude: ${location.latitude}, \nLongitude: ${location.longitude}`;
      window.location.href = `mailto:${emergencyEmails[service]}?subject=Emergency Alert&body=${encodeURIComponent(emailBody)}`;
    });

    setIsModalOpen(false);
  };

  return (
    <div className="text-center mt-8">
      <button
        onClick={handleLocationRequest}
        className="bg-gradient-to-r from-red-900 to-red-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition duration-300"
      >
        Emergency
      </button>

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
    </div>
  );
};

export default EmergencyButton;
