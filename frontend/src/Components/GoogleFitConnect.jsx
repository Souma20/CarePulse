import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/config";

const GoogleFitConnect = ({ userId, onConnect }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // The actual Google Fit API implementation would require additional setup
  // including OAuth 2.0 authorization and API key configuration
  const connectToGoogleFit = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      // In a real implementation, this would use the Google OAuth 2.0 flow
      // and request scopes for fitness data
      
      // Mock implementation for demonstration
      const auth = window.gapi?.auth2;
      
      if (!auth) {
        throw new Error("Google API not loaded. Please check if the Google API script is included.");
      }
      
      // Request Google Fit scopes
      const scopes = [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.body.read'
      ];
      
      await auth.getAuthInstance().signIn({
        scope: scopes.join(' ')
      });
      
      // Update user profile in Firestore
      await updateDoc(doc(firestore, "users", userId), {
        googleFitConnected: true,
        lastGoogleFitSync: new Date()
      });
      
      // Call the onConnect callback to update UI
      if (onConnect) {
        onConnect();
      }
      
    } catch (err) {
      console.error("Error connecting to Google Fit:", err);
      setError(err.message || "Failed to connect to Google Fit");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div>
      <button
        onClick={connectToGoogleFit}
        disabled={connecting}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg
          ${connecting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} 
          text-white transition duration-300
        `}
      >
        <TrendingUp size={18} />
        <span>{connecting ? "Connecting..." : "Connect Google Fit"}</span>
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default GoogleFitConnect;