import React, { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import * as faceapi from 'face-api.js';
import { motion } from "framer-motion";

const FaceRecognition = () => {
  const [faceDetector, setFaceDetector] = useState(null);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referenceImages, setReferenceImages] = useState({});
  const [detectedPersons, setDetectedPersons] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState("Loading models...");
  const [showMockInput, setShowMockInput] = useState(true);
  const [mockImageProcessed, setMockImageProcessed] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const mockFileInputRef = useRef(null);
  const liveViewRef = useRef(null);
  const detectionInterval = useRef(null);
  const lastVideoTime = useRef(-1);

  // Sample mock image URL (using placeholder for Salif Shaikh)
  const mockSalifImage = "/copy.jpg";
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Initialize face detection models
  useEffect(() => {
    const initializeModels = async () => {
      try {
        setLoadingStatus("Loading MediaPipe face detector...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
          },
          runningMode: "VIDEO"
        });
        
        setFaceDetector(detector);
        
        setLoadingStatus("Loading face recognition models...");
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        
        setLoadingStatus("Ready to use!");
        setLoading(false);

        // Automatically process mock data
        processMockSalifImage();
      } catch (err) {
        console.error("Error initializing models:", err);
        setError("Failed to initialize face recognition models. Please check your internet connection and try again.");
        setLoading(false);
      }
    };

    initializeModels();

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Process mock image for Salif Shaikh
  const processMockSalifImage = async () => {
    try {
      setLoadingStatus("Processing reference image for Salif Shaikh...");
      setLoading(true);
      
      // In a real scenario, you would use a real image and descriptor
      // Here we're creating a mock descriptor (this won't work for actual recognition)
      const mockDescriptor = new Float32Array(128).fill(0.5);
      for (let i = 0; i < mockDescriptor.length; i++) {
        mockDescriptor[i] = Math.random() * 0.6 + 0.2; // Random values between 0.2 and 0.8
      }
      
      const salifData = {
        descriptor: mockDescriptor,
        imageUrl: mockSalifImage
      };
      
      setReferenceImages(prev => ({
        ...prev,
        "Salif Shaikh": salifData
      }));
      
      updateFaceMatcher({
        ...referenceImages,
        "Salif Shaikh": salifData
      });
      
      console.log("Reference image for Salif Shaikh added successfully");
      setLoadingStatus("Reference image for Salif Shaikh added successfully!");
      setMockImageProcessed(true);
      setLoading(false);
    } catch (err) {
      console.error("Error processing mock image:", err);
      setError("Failed to process reference image for Salif Shaikh.");
      setLoading(false);
    }
  };

  // Handle reference image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setLoadingStatus(`Processing reference image: ${file.name}...`);
      setLoading(true);
      
      const imageUrl = URL.createObjectURL(file);
      const img = await faceapi.fetchImage(imageUrl);
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detections) {
        setError(`No face detected in the uploaded image for ${file.name.split('.')[0]}. Please try another image.`);
        setLoading(false);
        return;
      }
      
      const personName = file.name.split('.')[0];
      
      setReferenceImages(prev => ({
        ...prev,
        [personName]: {
          descriptor: detections.descriptor,
          imageUrl
        }
      }));
      
      updateFaceMatcher({
        ...referenceImages,
        [personName]: {
          descriptor: detections.descriptor,
          imageUrl
        }
      });
      
      console.log(`Reference image for ${personName} added successfully`);
      setLoadingStatus(`Reference image for ${personName} added successfully!`);
      setLoading(false);
    } catch (err) {
      console.error("Error processing reference image:", err);
      setError("Failed to process reference image. Please try another image.");
      setLoading(false);
    }
  };

  // Update face matcher when reference images change
  const updateFaceMatcher = (images) => {
    if (Object.keys(images).length === 0) return;
    
    const labeledDescriptors = Object.entries(images).map(([name, data]) => {
      return new faceapi.LabeledFaceDescriptors(name, [data.descriptor]);
    });
    
    const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    setFaceMatcher(matcher);
  };

  // Enable webcam
  const enableWebcam = async () => {
    if (!faceDetector) {
      setError("Face Detection models are still loading. Please try again.");
      return;
    }

    try {
      const constraints = { 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      videoRef.current.onloadedmetadata = () => {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      };
      
      setIsWebcamActive(true);
      
      videoRef.current.addEventListener("loadeddata", startFaceDetection);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Failed to access webcam. Please check camera permissions and try again.");
    }
  };

  // Start face detection loop
  const startFaceDetection = () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    detectionInterval.current = setInterval(detectFaces, 100);
  };

  // Mock detection function to simulate recognizing Salif
  const simulateSalifDetection = () => {
    // This would be triggered when we want to simulate detecting Salif in the video feed
    setDetectedPersons(["Salif Shaikh"]);
  };

  // Detect faces in video feed
  const detectFaces = async () => {
    if (!faceDetector || !videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    if (videoRef.current.currentTime === lastVideoTime.current) {
      return;
    }
    lastVideoTime.current = videoRef.current.currentTime;
    
    try {
      const startTimeMs = performance.now();
      const { detections } = faceDetector.detectForVideo(videoRef.current, startTimeMs);
      
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      if (faceMatcher && Object.keys(referenceImages).length > 0) {
        const faceApiDetections = await faceapi
          .detectAllFaces(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        const detected = [];
        
        if (faceApiDetections && faceApiDetections.length > 0) {
          faceApiDetections.forEach(detection => {
            const match = faceMatcher.findBestMatch(detection.descriptor);
            const matchName = match.label;
            const matchConfidence = (1 - match.distance) * 100;
            
            if (matchName !== 'unknown' && matchConfidence > 70) {
              detected.push(matchName);
              
              const box = detection.detection.box;
              ctx.strokeStyle = '#00FF00';
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              
              ctx.font = '24px Arial';
              ctx.fillStyle = '#00FF00';
              ctx.fillText(`${matchName} (${matchConfidence.toFixed(1)}%)`, box.x, box.y - 10);
              
              console.log(`Detected: ${matchName} with confidence ${matchConfidence.toFixed(1)}%`);
            } else {
              const box = detection.detection.box;
              ctx.strokeStyle = '#FF0000';
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              
              ctx.font = '24px Arial';
              ctx.fillStyle = '#FF0000';
              ctx.fillText('Unknown', box.x, box.y - 10);
            }
          });
        }
        
        setDetectedPersons(detected);
        
      } else {
        detections.forEach(detection => {
          const { originX, originY, width, height } = detection.boundingBox;
          ctx.strokeStyle = '#FFFF00';
          ctx.lineWidth = 2;
          ctx.strokeRect(originX, originY, width, height);
          
          ctx.font = '18px Arial';
          ctx.fillStyle = '#FFFF00';
          ctx.fillText(
            `Face: ${Math.round(detection.categories[0].score * 100)}%`, 
            originX, 
            originY - 10
          );
        });
      }

    } catch (err) {
      console.error("Error in face detection:", err);
    }
  };

  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Add mock image from Salif Shaikh to user uploads
  const useMockImage = () => {
    if (mockImageProcessed) {
      setShowMockInput(false);
    } else {
      processMockSalifImage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        <br></br><br></br>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              FaceID
            </span>
            <span className="text-white"> Pro</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Advanced facial recognition system with real-time detection and matching capabilities
          </p>
        </motion.div>

        {/* Status Indicators */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-8 text-center max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-blue-400 text-lg mb-8 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-400"></div>
              <span>{loadingStatus}</span>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Left Column - Reference Images */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-slate-700"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-blue-600/20 mr-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Reference Database</h2>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-6 bg-slate-900/50 rounded-lg p-1">
              <button 
                className={`flex-1 py-2 rounded-lg font-medium transition-all duration-300 ${activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => handleTabChange('upload')}
              >
                Upload Image
              </button>
              <button 
                className={`flex-1 py-2 rounded-lg font-medium transition-all duration-300 ${activeTab === 'mock' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                onClick={() => handleTabChange('mock')}
              >
                Use Sample
              </button>
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-gray-300 mb-4">
                  Upload an image of a person you want to recognize. The filename (without extension) will be used as the person's name.
                </p>
                
                <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-300">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </motion.div>
            )}

            {/* Mock Data Tab */}
            {activeTab === 'mock' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/40 rounded-lg p-4"
              >
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-lg overflow-hidden mr-4 border border-gray-700">
                    <img 
                      src={mockSalifImage} 
                      alt="Salif Shaikh" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Salif Shaikh</h3>
                    <p className="text-gray-400 text-sm">Reference profile</p>
                  </div>
                </div>
                
                <button
                  onClick={useMockImage}
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-300 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  {mockImageProcessed ? "Sample Already Added" : "Use This Sample"}
                </button>
              </motion.div>
            )}

            {/* Reference Gallery */}
            {Object.keys(referenceImages).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Reference Gallery
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(referenceImages).map(([name, data]) => (
                    <motion.div 
                      key={name} 
                      className="bg-slate-900/70 rounded-lg overflow-hidden shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="h-32 overflow-hidden">
                        <img 
                          src={data.imageUrl} 
                          alt={`Reference for ${name}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-center">
                        <span className="text-blue-400 font-medium">{name}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right Column - Detection */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-slate-700"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-purple-600/20 mr-3">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Live Recognition</h2>
            </div>

            <p className="text-gray-300 mb-6">
              Start the webcam to begin real-time face recognition. The system will compare detected faces against your reference database.
            </p>

            <motion.button
              onClick={enableWebcam}
              disabled={isWebcamActive || loading}
              className={`w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center transition-all duration-300 ${isWebcamActive 
                ? 'bg-green-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'}`}
              whileHover={{ scale: isWebcamActive ? 1 : 1.02 }}
              whileTap={{ scale: isWebcamActive ? 1 : 0.98 }}
            >
              {isWebcamActive ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                  Webcam Active
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Start Webcam
                </>
              )}
            </motion.button>

            {/* Detection Results */}
            <motion.div
              variants={itemVariants}
              className="mt-6 bg-slate-900/60 rounded-lg p-4"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Recognition Results
              </h3>

              {detectedPersons.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...new Set(detectedPersons)].map((person, index) => (
                    <motion.div 
                      key={person} 
                      className="bg-green-900/30 border border-green-700/50 text-green-400 p-3 rounded-lg flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="bg-green-500/20 p-1 rounded-full mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <span className="font-medium">{person}</span>
                      <span className="ml-auto text-sm bg-green-800/50 px-2 py-1 rounded-md">Recognized</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                isWebcamActive ? (
                  <motion.div 
                    className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 p-3 rounded-lg text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    No faces recognized yet. Please ensure good lighting and positioning.
                  </motion.div>
                ) : (
                  <motion.div 
                    className="bg-slate-900/30 border border-slate-700/50 text-slate-400 p-3 rounded-lg text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Start the webcam to begin detecting and identifying faces.
                  </motion.div>
                )
              )}
            </motion.div>

            {/* Quick test button for demonstration */}
            {isWebcamActive && mockImageProcessed && (
              <motion.button
                onClick={simulateSalifDetection}
                className="mt-4 w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-300 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                </svg>
                Simulate Salif Detection (Demo)
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Video Feed Section */}
        <motion.div
          variants={itemVariants}
          className="mt-8 bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-slate-700"
        >
          <div className="relative">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-auto rounded-lg"
            ></video>
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FaceRecognition;