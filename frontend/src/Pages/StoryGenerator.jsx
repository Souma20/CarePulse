import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet-routing-machine";


// ─────────────────────────────────────────────────────────────────────────────
// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom icons
const ambulanceIcon = new L.Icon({
  iconUrl: "images/ambulance.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const userLocationIcon = new L.Icon({
  iconUrl: "images/user-location.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const hospitalIcon = new L.Icon({
  iconUrl: "images/hospital.png",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Fallback marker with SVG in case images don't load
const createFallbackIcon = (color, type) => {
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
        <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        ${type === 'hospital' ? '<rect fill="white" x="10" y="7" width="4" height="7"/><rect fill="white" x="8" y="9" width="8" height="3"/>' : ''}
        ${type === 'ambulance' ? '<path fill="white" d="M9,9H11V11H13V9H15V7H13V5H11V7H9V9Z"/>' : ''}
      </svg>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Use fallback icons if images fail to load
const fallbackAmbulanceIcon = createFallbackIcon("#FF0055", "ambulance");
const fallbackUserLocationIcon = createFallbackIcon("#3388ff", "user");
const fallbackHospitalIcon = createFallbackIcon("#27ae60", "hospital");

// ─────────────────────────────────────────────────────────────────────────────
// Framer Motion Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

const bounceIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300 },
  },
};

const buttonHover = {
  scale: 1.05,
  boxShadow: "0 0 15px rgba(255, 0, 85, 0.4), 0 0 30px rgba(255, 0, 85, 0.2) inset",
  transition: { duration: 0.2, ease: "easeInOut" },
};

const emergencyButtonPulse = {
  scale: [1, 1.05, 1],
  boxShadow: [
    "0 0 10px rgba(255, 0, 85, 0.4), 0 0 20px rgba(255, 0, 85, 0.2) inset",
    "0 0 20px rgba(255, 0, 85, 0.6), 0 0 40px rgba(255, 0, 85, 0.3) inset",
    "0 0 10px rgba(255, 0, 85, 0.4), 0 0 20px rgba(255, 0, 85, 0.2) inset",
  ],
  transition: {
    repeat: Infinity,
    duration: 1.5,
    ease: "easeInOut",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
function SetViewOnLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 15);
    }
  }, [coords, map]);
  return null;
}

// Expanding scanning circle
function MapScan({ isSearching, center }) {
  const [radius, setRadius] = useState(0);
  const [opacity, setOpacity] = useState(0.6);
  const maxRadius = 1000; // meters

  useEffect(() => {
    if (!isSearching || !center) return;

    let animationFrame;
    const startTime = Date.now();
    const duration = 4000; // 4 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setRadius(progress * maxRadius);
      setOpacity(0.6 - progress * 0.4); // fade out as it expands

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Restart the animation
        animationFrame = requestAnimationFrame(() => {
          setRadius(0);
          setOpacity(0.6);
          animate();
        });
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isSearching, center]);

  if (!isSearching || !center) return null;

  return (
    <Circle
      center={center}
      radius={radius}
      pathOptions={{
        color: "rgba(255, 0, 85, 0.8)",
        fillColor: `rgba(255, 0, 85, ${opacity})`,
        weight: 2,
      }}
    />
  );
}

// Build route with Leaflet Routing Machine
function RoadRoute({ startLocation, endLocation, setRoutePath }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!startLocation || !endLocation || !map) return;

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(startLocation[0], startLocation[1]),
        L.latLng(endLocation[0], endLocation[1]),
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      showAlternatives: false,
      fitSelectedRoutes: false,
      show: false,
      lineOptions: {
        styles: [{ color: "#FF0055", opacity: 0.8, weight: 6 }],
      },
      createMarker: () => null,
    }).addTo(map);

    routingControlRef.current = routingControl;

    routingControl.on("routesfound", (e) => {
      const coordinates = e.routes[0].coordinates.map((coord) => [coord.lat, coord.lng]);
      setRoutePath(coordinates);
    });

    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [startLocation, endLocation, map, setRoutePath]);

  return null;
}

// Move ambulance along route
function AmbulanceMovement({ routePath, stage, setStage, setAmbulanceLocation, setAmbulanceETA, setCompletedPath }) {
  const moveIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalTripDuration = 10 * 60 * 1000; // 10 minutes

  useEffect(() => {
    if (stage !== "enroute" || !routePath || routePath.length < 2) return;

    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);

    startTimeRef.current = Date.now();
    const totalSteps = routePath.length - 1;
    let currentStep = 0;

    // Start ambulance at the first point
    setAmbulanceLocation(routePath[0]);
    setCompletedPath([routePath[0]]);

    moveIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep < routePath.length) {
        setAmbulanceLocation(routePath[currentStep]);
        setCompletedPath((prev) => [...prev, routePath[currentStep]]);

        const progress = currentStep / totalSteps;
        const remainingMinutes = Math.ceil((1 - progress) * (totalTripDuration / (60 * 1000)));
        setAmbulanceETA(Math.max(1, remainingMinutes));

        if (currentStep === totalSteps) {
          clearInterval(moveIntervalRef.current);
          setStage("arrived");
        }
      }
    }, totalTripDuration / totalSteps);

    return () => {
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    };
  }, [stage, routePath, setAmbulanceLocation, setAmbulanceETA, setStage, setCompletedPath]);

  return null;
}

// Pulsing dot effect for user location
function PulsingDot({ position }) {
  const [radius, setRadius] = useState(10);
  const maxRadius = 30;

  useEffect(() => {
    const interval = setInterval(() => {
      setRadius((prev) => {
        if (prev >= maxRadius) return 10;
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <Circle
      center={position}
      radius={radius}
      pathOptions={{
        color: "#FF0055",
        fillColor: "rgba(255, 0, 85, 0.5)",
        fillOpacity: 1 - radius / maxRadius,
        weight: 2,
      }}
    />
  );
}

// Simple weather component for realism
function WeatherInfo({ condition = "clear" }) {
  const conditions = {
    clear: { icon: "☀️", text: "Clear", color: "text-yellow-400" },
    cloudy: { icon: "☁️", text: "Cloudy", color: "text-gray-300" },
    rainy: { icon: "🌧️", text: "Rainy", color: "text-blue-300" },
    foggy: { icon: "🌫️", text: "Foggy", color: "text-gray-400" },
  };

  const weather = conditions[condition] || conditions.clear;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-lg">{weather.icon}</span>
      <span className={weather.color}>{weather.text}</span>
      <span className="mx-2">•</span>
      <span>
        {new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main EmergencyResponse component
const EmergencyResponse = () => {
  const [stage, setStage] = useState("initial"); // initial, searching, found, enroute, arrived
  const [userLocation, setUserLocation] = useState(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);
  const [ambulanceETA, setAmbulanceETA] = useState(null);
  const [ambulanceDetails, setAmbulanceDetails] = useState(null);
  const [availableAmbulances, setAvailableAmbulances] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [routePath, setRoutePath] = useState(null);
  const [completedPath, setCompletedPath] = useState([]);
  const [remainingPath, setRemainingPath] = useState([]);
  const [messages, setMessages] = useState([]);
  const [weatherCondition, setWeatherCondition] = useState("clear");
  const [trafficCondition, setTrafficCondition] = useState("moderate");
  const [iconsLoaded, setIconsLoaded] = useState({
    ambulance: false,
    userLocation: false,
    hospital: false
  });

  // Check if custom icons are loading properly
  useEffect(() => {
    const checkImage = (url, type) => {
      const img = new Image();
      img.onload = () => {
        setIconsLoaded(prev => ({ ...prev, [type]: true }));
      };
      img.onerror = () => {
        console.warn(`Failed to load ${type} icon`);
      };
      img.src = url;
    };

    checkImage("images/ambulance.png", "ambulance");
    checkImage("images/user-location.png", "userLocation");
    checkImage("images/hospital.png", "hospital");
  }, []);

  // Generate ambulances/hospitals after user location is set
  useEffect(() => {
    if (!userLocation) return;

    // Generate ambulances
    const ambulances = [];
    for (let i = 0; i < 5; i++) {
      const offsetLat = (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
      const offsetLng = (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
      ambulances.push({
        id: "AMB-" + Math.floor(1000 + Math.random() * 9000),
        position: [userLocation[0] + offsetLat, userLocation[1] + offsetLng],
        driver: ["Dr. Rajesh Kumar", "Dr. Priya Singh", "Dr. Amit Patel", "Dr. Neha Sharma", "Dr. Sanjay Gupta"][i % 5],
        phone: "+91 98765 " + Math.floor(10000 + Math.random() * 90000),
        vehicle: ["Advanced Life Support", "Basic Life Support", "Cardiac Care Unit", "Neonatal ICU", "Mobile Trauma Unit"][i % 5],
        license:
          "DL " +
          Math.floor(10 + Math.random() * 90) +
          " " +
          String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
          String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
          " " +
          Math.floor(1000 + Math.random() * 9000),
        rating: (4 + Math.random()).toFixed(1),
        distanceKm: (1 + Math.random() * 3).toFixed(1),
        responseTime: Math.floor(3 + Math.random() * 7),
      });
    }
    setAvailableAmbulances(ambulances);

    // Generate hospitals
    const hospitals = [];
    for (let i = 0; i < 3; i++) {
      const offsetLat = (Math.random() * 0.03 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
      const offsetLng = (Math.random() * 0.03 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
      hospitals.push({
        id: i + 1,
        name: ["Apollo Hospitals", "Max Healthcare", "Fortis Hospital"][i],
        position: [userLocation[0] + offsetLat, userLocation[1] + offsetLng],
        specialties: ["Trauma Center", "Cardiac Care", "General Emergency"][i],
        distance: (2 + Math.random() * 5).toFixed(1) + " km",
        beds: Math.floor(10 + Math.random() * 20) + " available",
      });
    }
    setNearbyHospitals(hospitals);

    // Random weather & traffic
    const conditions = ["clear", "cloudy", "rainy", "foggy"];
    setWeatherCondition(conditions[Math.floor(Math.random() * conditions.length)]);
    const traffic = ["light", "moderate", "heavy"];
    setTrafficCondition(traffic[Math.floor(Math.random() * traffic.length)]);
  }, [userLocation]);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);
        },
        () => {
          // Default to New Delhi
          setUserLocation([28.6139, 77.2090]);
        }
      );
    }
  }, []);

  // Update remaining path
  useEffect(() => {
    if (routePath && routePath.length > 0 && completedPath.length > 0) {
      const lastCompleted = completedPath[completedPath.length - 1];
      let lastIndex = 0;
      for (let i = 0; i < routePath.length; i++) {
        if (routePath[i][0] === lastCompleted[0] && routePath[i][1] === lastCompleted[1]) {
          lastIndex = i;
          break;
        }
      }
      const remaining = routePath.slice(lastIndex + 1);
      setRemainingPath(remaining);
    }
  }, [routePath, completedPath]);

  // Add status messages for each stage
  useEffect(() => {
    const addMessage = (text) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text,
        },
      ]);
    };

    if (stage === "searching") {
      setMessages([]); // Clear previous
      addMessage("Emergency request initiated. Scanning for available ambulances...");

      setTimeout(() => {
        addMessage("Transmitting your GPS coordinates to responders...");
      }, 1500);

      setTimeout(() => {
        addMessage("Analyzing traffic conditions to find fastest route...");
      }, 3000);
    }

    if (stage === "found") {
      addMessage(`Ambulance dispatched: ${ambulanceDetails?.vehicle}, Driver: ${ambulanceDetails?.driver}`);
    }

    if (stage === "enroute") {
      addMessage("Ambulance en route to your location. ETA calculating...");
      setTimeout(() => {
        if (trafficCondition === "heavy") {
          addMessage("Heavy traffic detected. Alternate route suggested to driver.");
        } else if (weatherCondition === "rainy" || weatherCondition === "foggy") {
          addMessage(`Caution: ${weatherCondition} conditions may delay arrival.`);
        }
      }, 4000);
    }

    if (stage === "arrived") {
      addMessage("Ambulance has arrived at your location. Stay calm; help is here.");
    }
  }, [stage, ambulanceDetails, trafficCondition, weatherCondition]);

  // Call an ambulance
  const callAmbulance = () => {
    setStage("searching");

    // Simulate finding an ambulance
    setTimeout(() => {
      if (availableAmbulances.length > 0) {
        const selectedAmbulance = availableAmbulances[0];
        setAmbulanceLocation(selectedAmbulance.position);
        setAmbulanceDetails({
          id: selectedAmbulance.id,
          driver: selectedAmbulance.driver,
          phone: selectedAmbulance.phone,
          vehicle: selectedAmbulance.vehicle,
          license: selectedAmbulance.license,
          rating: selectedAmbulance.rating,
          distanceKm: selectedAmbulance.distanceKm,
          responseTime: selectedAmbulance.responseTime,
        });
        setStage("found");
        setAmbulanceETA(selectedAmbulance.responseTime);

        // After 3s, ambulance starts moving
        setTimeout(() => {
          setStage("enroute");
        }, 3000);
      }
    }, 5000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  return (
    <div className="bg-gradient-to-b from-[#0d0e24] to-[#131438] text-white min-h-screen pt-20">
      {/* MediAlert header - Fixed under navbar */}
      <section className="top-16 left-0 right-0 bg-[#0d0e24]/90 backdrop-blur-lg border-b border-white/10 py-3 px-6 flex items-center justify-between z-10">
        <div className="flex items-center">
          <motion.div
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-red-500 text-2xl mr-3"
          >
            🚑
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              MediAlert
            </h1>
            <p className="text-xs text-gray-400">Emergency Response System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <WeatherInfo condition={weatherCondition} />
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs flex items-center">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                stage === "arrived" ? "bg-green-500" : "bg-pink-500 animate-pulse"
              }`}
            ></span>
            {stage === "initial"
              ? "Ready"
              : stage === "searching"
              ? "Connecting"
              : stage === "found"
              ? "Dispatched"
              : stage === "enroute"
              ? "En Route"
              : "Arrived"}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 pt-16">
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - Map */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden relative border border-white/10 h-[60vh]">
              {userLocation ? (
                <MapContainer center={userLocation} zoom={15} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* User location marker & pulsing effect */}
                  <Marker 
                    position={userLocation} 
                    icon={iconsLoaded.userLocation ? userLocationIcon : fallbackUserLocationIcon}
                  >
                    <Popup>Your Location</Popup>
                  </Marker>
                  <PulsingDot position={userLocation} />

                  {/* Nearby hospitals */}
                  {nearbyHospitals.map((hospital) => (
                    <Marker 
                      key={hospital.id} 
                      position={hospital.position} 
                      icon={iconsLoaded.hospital ? hospitalIcon : fallbackHospitalIcon}
                    >
                      <Popup>
                        <div className="font-medium">{hospital.name}</div>
                        <div className="text-sm text-gray-600">{hospital.specialties}</div>
                        <div className="text-sm">{hospital.distance} • {hospital.beds}</div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Show available ambulances in initial stage */}
                  {stage === "initial" &&
                    availableAmbulances.map((amb) => (
                      <Marker 
                        key={amb.id} 
                        position={amb.position} 
                        icon={iconsLoaded.ambulance ? ambulanceIcon : fallbackAmbulanceIcon}
                      >
                        <Popup>
                          <div className="font-medium">{amb.vehicle}</div>
                          <div className="text-sm">Ambulance {amb.id}</div>
                          <div className="text-sm">Driver: {amb.driver}</div>
                          <div className="text-xs text-gray-600">{amb.distanceKm} km away</div>
                        </Popup>
                      </Marker>
                    ))}

                  {/* Build route once ambulance is found */}
                  {stage === "found" && userLocation && ambulanceLocation && (
                    <RoadRoute
                      startLocation={ambulanceLocation}
                      endLocation={userLocation}
                      setRoutePath={setRoutePath}
                    />
                  )}

                  {/* Completed route path (solid) */}
                  {completedPath.length > 1 && (
                    <Polyline
                      positions={completedPath}
                      pathOptions={{ color: "#FF0055", weight: 5, opacity: 0.8 }}
                    />
                  )}

                  {/* Remaining route path (dashed) */}
                  {remainingPath.length > 1 && (
                    <Polyline
                      positions={remainingPath}
                      pathOptions={{ color: "#FF0055", weight: 5, opacity: 0.4, dashArray: "10, 10" }}
                    />
                  )}

                  {/* Ambulance marker during found/enroute/arrived */}
                  {ambulanceLocation && (stage === "found" || stage === "enroute" || stage === "arrived") && (
                    <Marker 
                      position={ambulanceLocation} 
                      icon={iconsLoaded.ambulance ? ambulanceIcon : fallbackAmbulanceIcon}
                    >
                      <Popup>
                        <motion.div variants={bounceIn} initial="hidden" animate="visible">
                          <div className="font-medium">{ambulanceDetails?.vehicle}</div>
                          <div>ID: {ambulanceDetails?.id}</div>
                          <div>Driver: {ambulanceDetails?.driver}</div>
                          <div className="mt-1 font-medium">
                            ETA: {ambulanceETA} {ambulanceETA === 1 ? "minute" : "minutes"}
                          </div>
                        </motion.div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Scanning animation when searching */}
                  <MapScan isSearching={stage === "searching"} center={userLocation} />

                  {/* Move ambulance along route */}
                  {routePath && stage === "enroute" && (
                    <AmbulanceMovement
                      routePath={routePath}
                      stage={stage}
                      setStage={setStage}
                      setAmbulanceLocation={setAmbulanceLocation}
                      setAmbulanceETA={setAmbulanceETA}
                      setCompletedPath={setCompletedPath}
                    />
                  )}

                  <SetViewOnLocation coords={userLocation} />
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                </div>
              )}

              {/* Traffic indicator overlay */}
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg text-sm flex items-center gap-2 z-[400]">
                <span>Traffic:</span>
                <span
                  className={`${
                    trafficCondition === "light"
                      ? "text-green-400"
                      : trafficCondition === "moderate"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {trafficCondition.charAt(0).toUpperCase() + trafficCondition.slice(1)}
                </span>
              </div>
            </div>

            {/* Status Messages Panel */}
            {messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 h-[15vh] overflow-y-auto"
              >
                <h3 className="text-sm font-medium text-gray-300 mb-2">Status Updates</h3>
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 items-start"
                    >
                      <span className="text-xs text-gray-400 whitespace-nowrap">{msg.time}</span>
                      <span className="text-sm">{msg.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right column - Control Panel */}
          <div className="w-full lg:w-1/3">
            <motion.div
              variants={slideInRight}
              initial="hidden"
              animate="visible"
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-6">Emergency Response</h2>

              <AnimatePresence mode="wait">
                {stage === "initial" && (
                  <motion.div
                    key="initial"
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <p className="mb-4">
                      Press the button below to request an ambulance to your current location.
                    </p>
                    <motion.button
                      whileHover={buttonHover}
                      whileTap={buttonHover}
                      animate={emergencyButtonPulse}
                      onClick={callAmbulance}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                      <span className="text-3xl">🚨</span>
                      CALL AMBULANCE NOW
                    </motion.button>
                  </motion.div>
                )}

                {stage === "searching" && (
                  <motion.div
                    key="searching"
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="text-center"
                  >
                    <p className="mb-4">Scanning for the nearest available ambulance...</p>
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-400"></div>
                    </div>
                  </motion.div>
                )}

                {(stage === "found" || stage === "enroute" || stage === "arrived") && ambulanceDetails && (
                  <motion.div
                    key="details"
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <div className="bg-[#1c1d3e]/50 p-4 rounded-xl mb-6 shadow-inner">
                      <h3 className="font-bold text-pink-400 mb-2">Ambulance Details</h3>
                      <p className="text-sm">
                        <span className="text-gray-300">Vehicle:</span> {ambulanceDetails.vehicle}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-300">ID:</span> {ambulanceDetails.id}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-300">Driver:</span> {ambulanceDetails.driver}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-300">Contact:</span> {ambulanceDetails.phone}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-300">License:</span> {ambulanceDetails.license}
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-300">Rating:</span> {ambulanceDetails.rating} ★
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-300">Distance:</span> {ambulanceDetails.distanceKm} km
                      </p>
                    </div>

                    {stage === "found" && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400 mb-2">Ambulance Found!</p>
                        <p>An ambulance has been dispatched to your location.</p>
                        <p className="mt-4 text-xl">
                          Estimated Time of Arrival:{" "}
                          <span className="text-pink-400 font-bold">{ambulanceETA} minutes</span>
                        </p>
                        <p className="mt-2 text-blue-300">Calculating fastest route...</p>
                      </div>
                    )}

                    {stage === "enroute" && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400 mb-2">Ambulance En Route</p>
                        <p>Your ambulance is on its way.</p>
                        <div className="mt-4 mb-4 bg-[#0a0b1d] p-3 rounded-xl shadow-inner">
                          <p className="text-xl">Estimated Time of Arrival:</p>
                          <p className="text-3xl text-pink-400 font-bold">
                            {ambulanceETA} {ambulanceETA === 1 ? "minute" : "minutes"}
                          </p>
                          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                            <div
                              className="bg-pink-400 h-2.5 rounded-full"
                              style={{ width: `${(10 - Math.min(ambulanceETA, 10)) * 10}%` }}
                            ></div>
                          </div>
                        </div>
                        <p className="text-sm text-blue-300 mb-4">
                          The ambulance is following the fastest road route.
                        </p>
                        <motion.button
                          whileHover={buttonHover}
                          onClick={() => window.open(`tel:${ambulanceDetails.phone}`)}
                          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
                        >
                          Call Driver
                        </motion.button>
                      </div>
                    )}

                    {stage === "arrived" && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400 mb-2">Ambulance Has Arrived!</p>
                        <p>Your ambulance has reached your location.</p>
                        <p className="mt-4">Please prepare for immediate assistance.</p>
                        <motion.button
                          whileHover={buttonHover}
                          onClick={() => window.open(`tel:${ambulanceDetails.phone}`)}
                          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
                        >
                          Call Driver
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyResponse;
