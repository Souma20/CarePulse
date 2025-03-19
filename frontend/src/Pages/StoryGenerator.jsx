import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet-routing-machine";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom ambulance icon
const ambulanceIcon = new L.Icon({
  iconUrl: "images/ambulance.png", // Ensure this image exists in your public folder
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Framer Motion Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const bounceIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300 } },
};

const buttonHover = {
  scale: 1.05,
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
  transition: { duration: 0.2, ease: "easeInOut" },
};

// Component to update map view when coordinates change
function SetViewOnLocation({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      console.log("Setting map view to:", coords);
      map.setView(coords, 15);
    }
  }, [coords, map]);
  return null;
}

// Scanning animation component
function MapScan({ isSearching, center }) {
  const [radius, setRadius] = useState(0);
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
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };

    console.log("Starting scanning animation");
    animationFrame = requestAnimationFrame(animate);
    return () => {
      console.log("Cancelling scanning animation");
      cancelAnimationFrame(animationFrame);
    };
  }, [isSearching, center]);

  if (!isSearching || !center) return null;

  return (
    <Circle
      center={center}
      radius={radius}
      pathOptions={{
        color: "rgba(255, 0, 0, 0.6)",
        fillColor: "rgba(255, 0, 0, 0.1)",
        weight: 2,
      }}
    />
  );
}

// Road route component using Leaflet Routing Machine
function RoadRoute({ startLocation, endLocation, setRoutePath }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!startLocation || !endLocation || !map) return;
    console.log("Creating road route from", startLocation, "to", endLocation);

    if (routingControlRef.current) map.removeControl(routingControlRef.current);

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
        styles: [{ color: "#0066FF", opacity: 0.8, weight: 6 }],
      },
      createMarker: () => null,
    }).addTo(map);

    routingControlRef.current = routingControl;

    routingControl.on("routesfound", (e) => {
      console.log("Route found:", e.routes[0]);
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

// Ambulance movement along the route
function AmbulanceMovement({ routePath, stage, setStage, setAmbulanceLocation, setAmbulanceETA, setCompletedPath }) {
  const moveIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalTripDuration = 10 * 60 * 1000; // 10 minutes
  
  useEffect(() => {
    if (stage !== "enroute" || !routePath || routePath.length < 2) return;
    console.log("Starting ambulance movement along route...");

    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);

    startTimeRef.current = Date.now();
    const totalSteps = routePath.length - 1;
    let currentStep = 0;

    setAmbulanceLocation(routePath[0]);
    setCompletedPath([routePath[0]]);

    moveIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep < routePath.length) {
        console.log("Moving to route point index:", currentStep);
        setAmbulanceLocation(routePath[currentStep]);
        setCompletedPath((prev) => [...prev, routePath[currentStep]]);
        const progress = currentStep / totalSteps;
        const remainingMinutes = Math.ceil((1 - progress) * (totalTripDuration / (60 * 1000)));
        setAmbulanceETA(Math.max(1, remainingMinutes));

        if (currentStep === totalSteps) {
          console.log("Ambulance reached destination.");
          clearInterval(moveIntervalRef.current);
          setStage("arrived");
        }
      }
    }, totalTripDuration / totalSteps);

    return () => {
      console.log("Cleaning up ambulance movement interval.");
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    };
  }, [stage, routePath, setAmbulanceLocation, setAmbulanceETA, setStage, setCompletedPath]);

  return null;
}

// Main StoryGenerator component
const StoryGenerator = () => {
  const [stage, setStage] = useState("initial"); // initial, searching, found, enroute, arrived
  const [userLocation, setUserLocation] = useState(null);
  const [ambulanceLocation, setAmbulanceLocation] = useState(null);
  const [ambulanceETA, setAmbulanceETA] = useState(null);
  const [ambulanceDetails, setAmbulanceDetails] = useState(null);
  const [availableAmbulances, setAvailableAmbulances] = useState([]);
  const [routePath, setRoutePath] = useState(null);
  const [completedPath, setCompletedPath] = useState([]);
  const [remainingPath, setRemainingPath] = useState([]);

  // Get user location on mount
  useEffect(() => {
    console.log("Getting user location...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          console.log("User location set to:", coords);
          setUserLocation(coords);
          // Generate static nearby ambulances
          const ambulances = [];
          for (let i = 0; i < 5; i++) {
            const offsetLat = (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
            const offsetLng = (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
            ambulances.push({
              id: "AMB-" + Math.floor(1000 + Math.random() * 9000),
              position: [coords[0] + offsetLat, coords[1] + offsetLng],
              driver: ["Dr. Rajesh Kumar", "Dr. Priya Singh", "Dr. Amit Patel", "Dr. Neha Sharma", "Dr. Sanjay Gupta"][i % 5],
              phone: "+91 98765 " + Math.floor(10000 + Math.random() * 90000),
              vehicle: ["Life Support Ambulance", "Basic Ambulance", "Cardiac Ambulance", "Neonatal Ambulance", "Mobile ICU"][i % 5],
              license: "DL " + Math.floor(10 + Math.random() * 90) + " " +
                       String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                       String.fromCharCode(65 + Math.floor(Math.random() * 26)) + " " +
                       Math.floor(1000 + Math.random() * 9000)
            });
          }
          console.log("Available ambulances:", ambulances);
          setAvailableAmbulances(ambulances);
        },
        (error) => {
          console.error("Error getting location:", error);
          setUserLocation([28.6139, 77.2090]); // Default to New Delhi
        }
      );
    }
  }, []);

  // Update remaining path when route or completed path changes
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
      console.log("Remaining path updated:", remaining);
      setRemainingPath(remaining);
    }
  }, [routePath, completedPath]);

  // Function to simulate ambulance call
  const callAmbulance = () => {
    console.log("Ambulance call initiated. Changing stage to 'searching'.");
    setStage("searching");

    setTimeout(() => {
      if (availableAmbulances.length > 0) {
        const selectedAmbulance = availableAmbulances[0];
        console.log("Ambulance selected:", selectedAmbulance);
        setAmbulanceLocation(selectedAmbulance.position);
        setAmbulanceDetails({
          id: selectedAmbulance.id,
          driver: selectedAmbulance.driver,
          phone: selectedAmbulance.phone,
          vehicle: selectedAmbulance.vehicle,
          license: selectedAmbulance.license,
        });
        setStage("found");
        setAmbulanceETA(10); // Rough ETA

        setTimeout(() => {
          console.log("Changing stage to 'enroute'.");
          setStage("enroute");
        }, 3000);
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.h1
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-4xl font-extrabold text-center mb-10"
        >
          Emergency Ambulance Tracking
        </motion.h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Map Section */}
          <div className="w-full md:w-2/3 h-[70vh] bg-gray-800 rounded-xl shadow-2xl overflow-hidden relative">
            {userLocation ? (
              <MapContainer center={userLocation} zoom={15} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={userLocation}>
                  <Popup>Your Location</Popup>
                </Marker>

                {stage === "initial" && availableAmbulances.map((amb) => (
                  <Marker key={amb.id} position={amb.position} icon={ambulanceIcon}>
                    <Popup>
                      Ambulance {amb.id}
                      <br />
                      Driver: {amb.driver}
                    </Popup>
                  </Marker>
                ))}

                {stage === "found" && userLocation && ambulanceLocation && (
                  <RoadRoute 
                    startLocation={ambulanceLocation} 
                    endLocation={userLocation} 
                    setRoutePath={setRoutePath} 
                  />
                )}

                {completedPath.length > 1 && (
                  <Polyline
                    positions={completedPath}
                    pathOptions={{ color: "#0066FF", weight: 5, opacity: 0.8 }}
                  />
                )}

                {remainingPath.length > 1 && (
                  <Polyline
                    positions={remainingPath}
                    pathOptions={{ color: "#0066FF", weight: 5, opacity: 0.4, dashArray: "10, 10" }}
                  />
                )}

                {ambulanceLocation && (stage === "found" || stage === "enroute" || stage === "arrived") && (
                  <Marker position={ambulanceLocation} icon={ambulanceIcon}>
                    <Popup>
                      <motion.div variants={bounceIn} initial="hidden" animate="visible">
                        Ambulance {ambulanceDetails?.id}
                        <br />
                        Driver: {ambulanceDetails?.driver}
                        <br />
                        ETA: {ambulanceETA} {ambulanceETA === 1 ? "minute" : "minutes"}
                      </motion.div>
                    </Popup>
                  </Marker>
                )}

                <MapScan isSearching={stage === "searching"} center={userLocation} />

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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="w-full md:w-1/3 bg-[#13142d] rounded-xl p-6 shadow-2xl">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-2xl font-bold mb-6">Emergency Response</h2>

              <AnimatePresence exitBeforeEnter>
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
                      onClick={callAmbulance}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                      <span className="animate-pulse text-3xl">●</span>
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
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
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
                    <div className="bg-[#1c1d3e] p-4 rounded-xl mb-6">
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
                        <p className="mt-2 text-blue-300">Calculating fastest route...</p>
                      </div>
                    )}

                    {stage === "enroute" && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400 mb-2">Ambulance En Route</p>
                        <p>Your ambulance is on its way.</p>
                        <div className="mt-4 mb-4 bg-[#0a0b1d] p-3 rounded-xl">
                          <p className="text-xl">Estimated Time of Arrival:</p>
                          <p className="text-3xl text-yellow-400 font-bold">
                            {ambulanceETA} {ambulanceETA === 1 ? "minute" : "minutes"}
                          </p>
                          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                            <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${(10 - Math.min(ambulanceETA, 10)) * 10}%` }}></div>
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

export default StoryGenerator;
