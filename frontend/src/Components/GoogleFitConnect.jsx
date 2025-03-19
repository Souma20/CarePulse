import React, { useState, useEffect } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/config";
import { googleFitService } from "../googleFitService/googleFitService";

const GoogleFitConnect = ({ userId, onConnect }) => {
  const [status, setStatus] = useState("idle"); // idle, loading, connecting, connected, error
  const [error, setError] = useState(null);
  const [detailedError, setDetailedError] = useState(null);

  useEffect(() => {
    // Initialize Google Fit API when component mounts
    const initGoogleFit = async () => {
      try {
        setStatus("loading");
        await googleFitService.loadGoogleFitAPI();
        
        // Check if already authenticated
        if (googleFitService.isUserAuthenticated()) {
          setStatus("connected");
        } else {
          setStatus("idle");
        }
      } catch (err) {
        console.error("Failed to load Google Fit API:", err);
        setStatus("error");
        setError("Google Fit API failed to load");
        setDetailedError(err.toString());
      }
    };
    
    initGoogleFit();
  }, []);

  const connectToGoogleFit = async () => {
    setStatus("connecting");
    setError(null);
    setDetailedError(null);
    
    try {
      await googleFitService.signIn();
      
      // Update user profile in Firestore
      if (userId) {
        try {
          await updateDoc(doc(firestore, "users", userId), {
            googleFitConnected: true,
            lastGoogleFitSync: new Date()
          });
        } catch (firestoreErr) {
          console.error("Firestore update error:", firestoreErr);
          // Continue even if Firestore update fails
        }
      }
      
      setStatus("connected");
      
      // Call the onConnect callback to update UI
      if (onConnect) {
        onConnect();
      }
      
    } catch (err) {
      console.error("Error connecting to Google Fit:", err);
      setStatus("error");
      setError("Failed to connect to Google Fit");
      setDetailedError(err.toString());
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={connectToGoogleFit}
        disabled={status === "loading" || status === "connecting"}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg
          ${status === "loading" || status === "connecting" ? 'bg-blue-300' : 
           status === "connected" ? 'bg-green-600 hover:bg-green-700' :
           status === "error" ? 'bg-red-600 hover:bg-red-700' :
           'bg-blue-600 hover:bg-blue-700'} 
          text-white transition duration-300
        `}
      >
        <TrendingUp size={18} />
        <span>
          {status === "loading" ? "Loading API..." : 
           status === "connecting" ? "Connecting..." :
           status === "connected" ? "Connected to Google Fit" :
           status === "error" ? "Retry Connection" :
           "Connect Google Fit"}
        </span>
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 rounded flex items-start">
          <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            {detailedError && <p className="text-xs mt-1">{detailedError}</p>}
            <p className="text-xs mt-2">Please verify your Google API configuration and try again.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleFitConnect;