import React, { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import * as faceapi from 'face-api.js';
import "./FaceRecognition.css";

const FaceRecognition = () => {
  const [faceDetector, setFaceDetector] = useState(null);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referenceImages, setReferenceImages] = useState({});
  const [detectedPersons, setDetectedPersons] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState("Loading models...");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const liveViewRef = useRef(null);
  const detectionInterval = useRef(null);
  const lastVideoTime = useRef(-1);

  // Initialize face detection models
  useEffect(() => {
    const initializeModels = async () => {
      try {
        setLoadingStatus("Loading MediaPipe face detector...");
        // Load MediaPipe face detector
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
        
        // Load face-api.js models
        setLoadingStatus("Loading face recognition models...");
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        
        setLoadingStatus("Ready to use!");
        setLoading(false);
      } catch (err) {
        console.error("Error initializing models:", err);
        setError("Failed to initialize face recognition models. Please check your internet connection and try again.");
        setLoading(false);
      }
    };

    initializeModels();

    // Cleanup function
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      
      // Stop webcam if active
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Handle reference image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setLoadingStatus(`Processing reference image: ${file.name}...`);
      setLoading(true);
      
      // Create a URL for the image
      const imageUrl = URL.createObjectURL(file);
      
      // Load the image
      const img = await faceapi.fetchImage(imageUrl);
      
      // Detect the face in the image
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detections) {
        setError(`No face detected in the uploaded image for ${file.name.split('.')[0]}. Please try another image.`);
        setLoading(false);
        return;
      }
      
      // Create a labeled face descriptor
      const personName = file.name.split('.')[0]; // Use filename (without extension) as person name
      
      // Add to reference images
      setReferenceImages(prev => ({
        ...prev,
        [personName]: {
          descriptor: detections.descriptor,
          imageUrl
        }
      }));
      
      // Update face matcher
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
    
    const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 is the distance threshold
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
      
      // Set up video stream
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      // Set up canvas with same dimensions
      videoRef.current.onloadedmetadata = () => {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      };
      
      setIsWebcamActive(true);
      
      // Start prediction loop once video is loaded
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
    
    // Run detection approximately every 100ms
    detectionInterval.current = setInterval(detectFaces, 100);
  };

  // Detect faces in video feed
  const detectFaces = async () => {
    if (!faceDetector || !videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    // Only process if video has new frame
    if (videoRef.current.currentTime === lastVideoTime.current) {
      return;
    }
    lastVideoTime.current = videoRef.current.currentTime;
    
    try {
      // Get MediaPipe detections (faster, more accurate for detection)
      const startTimeMs = performance.now();
      const { detections } = faceDetector.detectForVideo(videoRef.current, startTimeMs);
      
      // Clear canvas
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // If we have reference images and face matcher, use face-api.js for recognition
      if (faceMatcher && Object.keys(referenceImages).length > 0) {
        // Get face-api detections for recognition
        const faceApiDetections = await faceapi
          .detectAllFaces(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        // Process recognized faces
        const detected = [];
        
        if (faceApiDetections && faceApiDetections.length > 0) {
          faceApiDetections.forEach(detection => {
            const match = faceMatcher.findBestMatch(detection.descriptor);
            const matchName = match.label;
            const matchConfidence = (1 - match.distance) * 100;
            
            if (matchName !== 'unknown' && matchConfidence > 70) {
              detected.push(matchName);
              
              // Draw box and label
              const box = detection.detection.box;
              ctx.strokeStyle = '#00FF00';
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              
              // Draw label
              ctx.font = '24px Arial';
              ctx.fillStyle = '#00FF00';
              ctx.fillText(`${matchName} (${matchConfidence.toFixed(1)}%)`, box.x, box.y - 10);
              
              // Log to console
              console.log(`Detected: ${matchName} with confidence ${matchConfidence.toFixed(1)}%`);
            } else {
              // Draw unknown face
              const box = detection.detection.box;
              ctx.strokeStyle = '#FF0000';
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              
              // Draw label for unknown
              ctx.font = '24px Arial';
              ctx.fillStyle = '#FF0000';
              ctx.fillText('Unknown', box.x, box.y - 10);
            }
          });
        }
        
        // Update state with detected persons
        setDetectedPersons(detected);
        
      } else {
        // If no reference images yet, just show detection boxes using MediaPipe
        detections.forEach(detection => {
          // Draw bounding box
          const { originX, originY, width, height } = detection.boundingBox;
          ctx.strokeStyle = '#FFFF00';
          ctx.lineWidth = 2;
          ctx.strokeRect(originX, originY, width, height);
          
          // Draw confidence label
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

  return (
    <div className="face-recognition-container">
      <h1>Face Recognition System</h1>
      
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">{loadingStatus}</div>}
      
      <div className="control-panel">
        <div className="reference-images-section">
          <h2>Step 1: Add Reference Images</h2>
          <p>Upload an image of a person you want to recognize. The filename (without extension) will be used as the person's name.</p>
          <p><strong>Example:</strong> If you upload "sohail.jpg", the system will look for "sohail" in the video feed.</p>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload} 
            accept="image/*" 
            className="file-input"
            disabled={loading}
          />
          
          {Object.keys(referenceImages).length > 0 && (
            <div className="reference-images-gallery">
              <h3>Reference People:</h3>
              <div className="reference-list">
                {Object.entries(referenceImages).map(([name, data]) => (
                  <div key={name} className="reference-item">
                    <img 
                      src={data.imageUrl} 
                      alt={`Reference for ${name}`} 
                      className="reference-thumbnail" 
                    />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="webcam-controls">
          <h2>Step 2: Start Face Recognition</h2>
          <button
            onClick={enableWebcam}
            disabled={isWebcamActive || loading}
            className="webcam-button"
          >
            {isWebcamActive ? "Webcam Active" : "Start Webcam"}
          </button>
        </div>
      </div>
      
      <div className="video-container">
        <div className="video-wrapper" ref={liveViewRef}>
          <video
            ref={videoRef}
            playsInline
            muted
            className="webcam-video"
          ></video>
          <canvas ref={canvasRef} className="detection-canvas"></canvas>
        </div>
        
        {detectedPersons.length > 0 && (
          <div className="detection-log">
            <h3>Detected People:</h3>
            <ul>
              {[...new Set(detectedPersons)].map(person => (
                <li key={person}>{person} is present in the video</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="instructions">
        <h2>How to Use This System:</h2>
        <ol>
          <li>Prepare images of people you want to recognize (ensure one clear face per image)</li>
          <li>Name each image file with the person's name (e.g., "sohail.jpg", "anna.jpg")</li>
          <li>Upload these reference images using the "Add Reference Images" button</li>
          <li>Click "Start Webcam" to begin real-time face recognition</li>
          <li>When a known person is detected, they will be labeled in the video and logged below</li>
        </ol>
        <p><strong>Note:</strong> For best results, use clear face images taken in good lighting.</p>
      </div>
    </div>
  );
};

export default FaceRecognition;