import { useState } from "react";
import { motion } from "framer-motion";
import { Resend } from 'resend'; // Install with: npm install resend

const EmergencyButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  // WARNING: NEVER expose API keys in the frontend for production apps
  // This is for development/demo purposes only
  const resend = new Resend('re_ZWa3WLgR_2kWo9PysCjhSzwDZe75zgzVq'); // For Vite projects
  // OR use process.env.REACT_APP_RESEND_API_KEY for Create React App

  const emergencyServices = {
    police: {
      email: "shaalu5050@gmail.com",
      icon: "🚓",
      label: "Police"
    },
    ambulance: {
      email: "chakrabortysouma20@gmail.com",
      icon: "🚑",
      label: "Ambulance"
    },
    firebrigade: {
      email: "faizshaikh29086@gmail.com",
      icon: "🚒",
      label: "Fire Brigade"
    }
  };

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(locationData);
          getAddressFromCoords(locationData);
          setIsModalOpen(true);
        },
        (error) => {
          alert(`Location access denied: ${error.message}. Please enable it manually.`);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const getAddressFromCoords = async (locationData) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}`
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error("Error getting address:", error);
    }
  };

  const handleServiceSelection = (service) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const sendEmergencyEmail = async () => {
    if (!location || selectedServices.length === 0) {
      alert("Please select at least one emergency service.");
      return;
    }

    setIsSending(true);
    setSendStatus(null);
    
    try {
      const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      
      // Create array of email promises
      const emailPromises = selectedServices.map(service => {
        const serviceInfo = emergencyServices[service];
        
        return resend.emails.send({
          from: 'Emergency Alert System <alerts@yourdomain.com>', // Replace with your verified domain
          to: [serviceInfo.email],
          subject: `EMERGENCY ALERT: ${serviceInfo.label} needed`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h1 style="color: #d32f2f; text-align: center;">URGENT HELP NEEDED!</h1>
              <div style="text-align: center; font-size: 24px; margin: 20px 0;">
                🚨 ${serviceInfo.icon} ${serviceInfo.label} Emergency Alert 🚨
              </div>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333;">Location Details:</h3>
                <p style="margin-bottom: 5px;"><strong>Latitude:</strong> ${location.latitude}</p>
                <p style="margin-bottom: 5px;"><strong>Longitude:</strong> ${location.longitude}</p>
                ${address ? `<p style="margin-bottom: 5px;"><strong>Address:</strong> ${address}</p>` : ''}
              </div>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${mapsLink}" style="display: inline-block; padding: 12px 24px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View on Google Maps</a>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
                Sent from Emergency Response System
              </p>
            </div>
          `
        });
      });
      
      await Promise.all(emailPromises);
      
      setSendStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedServices([]);
        setSendStatus(null);
      }, 2000);
    } catch (error) {
      console.error("Error sending emergency alert:", error);
      
      // Fallback to mailto if API call fails
      try {
        const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        
        // For each selected service, open a mailto link
        selectedServices.forEach(service => {
          const emailDetails = {
            to: emergencyServices[service].email,
            subject: `EMERGENCY ALERT: ${emergencyServices[service].label} needed`,
            body: `URGENT HELP NEEDED!\n\nLocation Details:\nLatitude: ${location.latitude}\nLongitude: ${location.longitude}\n${address ? `\nAddress: ${address}` : ''}\n\nView on Google Maps: ${mapsLink}\n\nSent from Emergency Response System`
          };
          
          window.open(`mailto:${emailDetails.to}?subject=${encodeURIComponent(emailDetails.subject)}&body=${encodeURIComponent(emailDetails.body)}`, '_blank');
        });
        
        setSendStatus('success');
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedServices([]);
          setSendStatus(null);
        }, 2000);
      } catch (mailtoError) {
        console.error("Mailto fallback also failed:", mailtoError);
        setSendStatus('error');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={handleLocationRequest}
        className="bg-gradient-to-r from-red-900 to-red-700 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition duration-300 flex items-center justify-center"
      >
        <span className="mr-2">🆘</span> Emergency
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg p-6 max-w-md w-full text-center shadow-xl"
          >
            <h2 className="text-2xl font-bold mb-2">Emergency Alert</h2>
            <p className="text-gray-600 mb-4">Select required emergency services</p>
            
            {address && (
              <div className="bg-gray-100 p-3 rounded-lg mb-4 text-left text-black">
                <p className="text-sm text-gray-600">Detected location:</p>
                <p className="text-sm font-medium">{address}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-3 mb-6 text-black">
              {Object.keys(emergencyServices).map((service) => (
                <label 
                  key={service} 
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedServices.includes(service) 
                      ? 'bg-red-100 border-red-600' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-3 h-5 w-5 accent-red-600"
                    checked={selectedServices.includes(service)}
                    onChange={() => handleServiceSelection(service)}
                  />
                  <span className="flex items-center">
                    <span className="mr-2 text-xl">{emergencyServices[service].icon}</span>
                    <span className="font-medium">{emergencyServices[service].label}</span>
                  </span>
                </label>
              ))}
            </div>
            
            {sendStatus === 'success' && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
                Alert sent successfully! Help is on the way.
              </div>
            )}
            
            {sendStatus === 'error' && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">
                Failed to send alert. Please try again or call emergency services directly.
              </div>
            )}
            
            <div className="flex justify-between text-black">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 px-5 py-2 rounded-lg font-medium transition-colors"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                onClick={sendEmergencyEmail}
                disabled={selectedServices.length === 0 || isSending}
                className={`${
                  selectedServices.length === 0 || isSending
                    ? 'bg-red-300'
                    : 'bg-red-600 hover:bg-red-700'
                } text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center`}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Alert'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EmergencyButton;