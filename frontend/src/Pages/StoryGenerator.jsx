import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion } from "framer-motion";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom ambulance icon
const ambulanceIcon = new L.Icon({
  iconUrl: "/images/ambulance-icon.png", // Add this image to your public folder
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Component to update map view when location changes
function StoryGenerator({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 15);
    }
  }, [coords, map]);
  return null;
}

// MapScan component to show scanning animation on map
function MapScan({ isSearching, center }) {
  const [radius, setRadius] = useState(0);
  const maxRadius = 1000; // Maximum scan radius in meters
  
  useEffect(() => {
    if (!isSearching || !center) return;
    
    let animationFrame;
    const startTime = Date.now();
    const duration = 4000; // 4 seconds for the scan
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setRadius(progress * maxRadius);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isSearching, center]);
  
  if (!isSearching || !center) return null;
  
  return (
    <Circle 
      center={center} 
      radius={radius} 
      pathOptions={{ 
        color: 'rgba(255, 0, 0, 0.6)', 
        fillColor: 'rgba(255, 0, 0, 0.1)', 
        weight: 2 
      }} 
    />
  );
}

// AmbulanceMovement component to handle ambulance route and movement
function AmbulanceMovement({ startLocation, endLocation, stage, setStage, setAmbulanceLocation, setAmbulanceETA }) {
  const moveIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalTripDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  useEffect(() => {
    if (stage !== "enroute" || !startLocation || !endLocation) return;
    
    // Clear any existing interval
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
    }
    
    startTimeRef.current = Date.now();
    const totalSteps = 300; // More steps for smoother movement
    const latDiff = (endLocation[0] - startLocation[0]) / totalSteps;
    const lngDiff = (endLocation[1] - startLocation[1]) / totalSteps;
    
    let currentStep = 0;
    
    moveIntervalRef.current = setInterval(() => {
      currentStep++;
      
      if (currentStep <= totalSteps) {
        // Calculate the ambulance's current position
        setAmbulanceLocation([
          startLocation[0] + latDiff * currentStep,
          startLocation[1] + lngDiff * currentStep
        ]);
        
        // Calculate the elapsed time
        const elapsedMs = Date.now() - startTimeRef.current;
        // Calculate the remaining time in minutes (more realistic)
        const remainingMinutes = Math.ceil((totalTripDuration - elapsedMs) / (60 * 1000));
        setAmbulanceETA(Math.max(1, remainingMinutes));
        
        // If we've used up all the time, force arrival
        if (elapsedMs >= totalTripDuration || currentStep === totalSteps) {
          clearInterval(moveIntervalRef.current);
          setAmbulanceLocation(endLocation);
          setStage("arrived");
        }
      }
    }, totalTripDuration / totalSteps); // Interval based on total trip duration
    
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, [stage, startLocation, endLocation, setAmbulanceLocation, setAmbulanceETA, setStage]);
  
  return null;
}

const TrackAmbulance = () => {
  const [stage, setStage] = useState("initial"); // initial -> searching -> found -> enroute -> arrived
  const [userLocation, setUserLocation] = useState(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);
  const [ambulanceETA, setAmbulanceETA] = useState(null);
  const [ambulanceDetails, setAmbulanceDetails] = useState(null);
  const [availableAmbulances, setAvailableAmbulances] = useState([]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          
          // Generate some static nearby ambulances
          const nearbyAmbulances = [];
          for (let i = 0; i < 5; i++) {
            // Generate position within 0.01-0.03 degrees (roughly 1-3km)
            const offsetLat = (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
            const offsetLng = (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
            
            nearbyAmbulances.push({
              id: "AMB-" + Math.floor(1000 + Math.random() * 9000),
              position: [
                position.coords.latitude + offsetLat,
                position.coords.longitude + offsetLng
              ],
              driver: ["Dr. Rajesh Kumar", "Dr. Priya Singh", "Dr. Amit Patel", "Dr. Neha Sharma", "Dr. Sanjay Gupta"][i % 5],
              phone: "+91 98765 " + Math.floor(10000 + Math.random() * 90000),
              vehicle: ["Life Support Ambulance", "Basic Ambulance", "Cardiac Ambulance", "Neonatal Ambulance", "Mobile ICU"][i % 5],
              license: "DL " + Math.floor(10 + Math.random() * 90) + " " + 
                       String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                       String.fromCharCode(65 + Math.floor(Math.random() * 26)) + " " + 
                       Math.floor(1000 + Math.random() * 9000)
            });
          }
          
          setAvailableAmbulances(nearbyAmbulances);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default location if geolocation fails
          setUserLocation([28.6139, 77.2090]); // New Delhi coordinates as default
        }
      );
    }
  }, []);

  // Call ambulance function
  const callAmbulance = () => {
    setStage("searching");
    
    // After 5 seconds, select the nearest ambulance
    setTimeout(() => {
      if (availableAmbulances.length > 0) {
        // Select the first ambulance (in a real app, you'd select the nearest one)
        const selectedAmbulance = availableAmbulances[0];
        
        setAmbulanceLocation(selectedAmbulance.position);
        setAmbulanceDetails({
          id: selectedAmbulance.id,
          driver: selectedAmbulance.driver,
          phone: selectedAmbulance.phone,
          vehicle: selectedAmbulance.vehicle,
          license: selectedAmbulance.license
        });
        
        setStage("found");
        // Calculate rough ETA - in real app would use actual distance calculation
        setAmbulanceETA(10); // Start with 10 minutes
        
        // After 3 seconds, start the ambulance movement
        setTimeout(() => {
          setStage("enroute");
        }, 3000);
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen pt-16 bg-[#0a0b1d] text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-8"
        >
          Emergency Ambulance Tracking
        </motion.h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Map Section */}
          <div className="w-full md:w-2/3 h-[70vh] bg-gray-800 rounded-lg overflow-hidden relative">
            {userLocation ? (
              <MapContainer
                center={userLocation}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* User location marker */}
                {userLocation && (
                  <Marker position={userLocation}>
                    <Popup>
                      Your Location
                    </Popup>
                  </Marker>
                )}
                
                {/* Available ambulances (only visible at initial stage) */}
                {stage === "initial" && availableAmbulances.map((amb) => (
                  <Marker key={amb.id} position={amb.position} icon={ambulanceIcon}>
                    <Popup>
                      Ambulance {amb.id}
                      <br />
                      Driver: {amb.driver}
                    </Popup>
                  </Marker>
                ))}
                
                {/* Selected ambulance (visible during found and enroute stages) */}
                {ambulanceLocation && (stage === "found" || stage === "enroute" || stage === "arrived") && (
                  <Marker position={ambulanceLocation} icon={ambulanceIcon}>
                    <Popup>
                      Ambulance {ambulanceDetails?.id}
                      <br />
                      Driver: {ambulanceDetails?.driver}
                      <br />
                      ETA: {ambulanceETA} {ambulanceETA === 1 ? 'minute' : 'minutes'}
                    </Popup>
                  </Marker>
                )}
                
                {/* Map scanning effect */}
                <MapScan isSearching={stage === "searching"} center={userLocation} />
                
                {/* Ambulance movement handler */}
                {userLocation && ambulanceLocation && stage === "enroute" && (
                  <AmbulanceMovement 
                    startLocation={ambulanceLocation}
                    endLocation={userLocation}
                    stage={stage}
                    setStage={setStage}
                    setAmbulanceLocation={setAmbulanceLocation}
                    setAmbulanceETA={setAmbulanceETA}
                  />
                )}
                
                <SetViewOnLocation coords={userLocation} />
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              </div>
            )}
          </div>
          
          {/* Control Panel */}
          <div className="w-full md:w-1/3 bg-[#13142d] rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Emergency Response</h2>
            
            {stage === "initial" && (
              <div>
                <p className="mb-4">
                  Press the emergency button to call an ambulance to your current location.
                </p>
                <button 
                  onClick={callAmbulance}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition duration-300 flex items-center justify-center gap-2"
                >
                  <span className="animate-pulse">●</span> 
                  CALL AMBULANCE NOW
                </button>
              </div>
            )}
            
            {stage === "searching" && (
              <div>
                <p className="mb-4 text-center">
                  Scanning for the nearest available ambulance...
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
                </div>
              </div>
            )}
            
            {(stage === "found" || stage === "enroute" || stage === "arrived") && ambulanceDetails && (
              <div>
                <div className="bg-[#1c1d3e] p-4 rounded-lg mb-6">
                  <h3 className="font-bold text-yellow-400 mb-2">Ambulance Details</h3>
                  <p><span className="text-gray-400">ID:</span> {ambulanceDetails.id}</p>
                  <p><span className="text-gray-400">Type:</span> {ambulanceDetails.vehicle}</p>
                  <p><span className="text-gray-400">Driver:</span> {ambulanceDetails.driver}</p>
                  <p><span className="text-gray-400">Contact:</span> {ambulanceDetails.phone}</p>
                  <p><span className="text-gray-400">License:</span> {ambulanceDetails.license}</p>
                </div>
                
                {stage === "found" && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400 mb-2">Ambulance Found!</p>
                    <p>An ambulance has been dispatched to your location.</p>
                    <p className="mt-4 text-xl">
                      Estimated Time of Arrival: <span className="text-yellow-400 font-bold">{ambulanceETA} minutes</span>
                    </p>
                  </div>
                )}
                
                {stage === "enroute" && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400 mb-2">Ambulance En Route</p>
                    <p>Your ambulance is on the way to your location.</p>
                    <div className="mt-4 mb-4 bg-[#0a0b1d] p-3 rounded-lg">
                      <p className="text-xl">
                        Estimated Time of Arrival: 
                      </p>
                      <p className="text-3xl text-yellow-400 font-bold">
                        {ambulanceETA} {ambulanceETA === 1 ? 'minute' : 'minutes'}
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${(10 - Math.min(ambulanceETA, 10)) * 10}%` }}></div>
                      </div>
                    </div>
                    <button 
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => window.open(`tel:${ambulanceDetails.phone}`)}
                    >
                      Call Driver
                    </button>
                  </div>
                )}
                
                {stage === "arrived" && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400 mb-2">Ambulance Has Arrived!</p>
                    <p>Your ambulance has arrived at your location.</p>
                    <p className="mt-4">Please prepare for immediate medical assistance.</p>
                    <button 
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => window.open(`tel:${ambulanceDetails.phone}`)}
                    >
                      Call Driver
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryGenerator;