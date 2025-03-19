import React, { useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";

// Icons
import { Cloud, Upload, Trash2, AlertTriangle, CheckCircle, AlertCircle, Activity } from "lucide-react";

const AccidentDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const imageRef = useRef(null);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const loadImageBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDetectionResult(null);
    setError(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectionResult(null);
    setError(null);
  };

  const handleDetectClick = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const base64Image = await loadImageBase64(selectedFile);
      const response = await axios({
        method: "POST",
        url: "https://detect.roboflow.com/accident-detection-8dvh5/1",
        params: {
          api_key: "RMg3UQ5Sr6ziHjXX4RFZ", // Note: Move this to environment variable in production
        },
        data: base64Image,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      setDetectionResult(response.data);
    } catch (error) {
      console.error(error.message);
      setError("Failed to analyze image. Please try again.");
    }
    setLoading(false);
  };

  // Calculate overlay positions based on detection results
  const renderAccidentOverlays = () => {
    if (!detectionResult || !detectionResult.predictions || !imageRef.current) return null;

    const imgWidth = imageRef.current.clientWidth;
    const imgHeight = imageRef.current.clientHeight;
    const originalWidth = detectionResult.image.width;
    const originalHeight = detectionResult.image.height;

    // Scale factor between original image and displayed image
    const scaleX = imgWidth / originalWidth;
    const scaleY = imgHeight / originalHeight;

    return detectionResult.predictions.map((pred, index) => {
      // Calculate scaled position and dimensions
      const x = (pred.x - pred.width / 2) * scaleX;
      const y = (pred.y - pred.height / 2) * scaleY;
      const width = pred.width * scaleX;
      const height = pred.height * scaleY;

      return (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="absolute border-2 border-red-500 pointer-events-none"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          <div className="absolute -top-7 left-0 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            {`${pred.class} (${Math.round(pred.confidence * 100)}%)`}
          </div>
        </motion.div>
      );
    });
  };

  const getSeverityColor = (classification) => {
    switch (classification.toLowerCase()) {
      case "severe":
        return "text-red-500 bg-red-100 border-red-500";
      case "moderate":
        return "text-orange-500 bg-orange-100 border-orange-500";
      case "minor":
        return "text-blue-500 bg-blue-100 border-blue-500";
      default:
        return "text-gray-500 bg-gray-100 border-gray-500";
    }
  };

  const getSeverityIcon = (classification) => {
    switch (classification.toLowerCase()) {
      case "severe":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "moderate":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "minor":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0b1d] text-white">
      {/* Header/Hero Section */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
        </div>
        <br></br>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 container mx-auto px-6 text-center"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            Vehicle <span className="text-red-500">Accident</span> Detection
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Advanced AI-powered analysis to detect and classify vehicle accidents in images.
            <br />Upload an image to analyze the severity and location of potential accidents.
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Upload Section */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-gradient-to-br from-[#13142d] to-[#191a3a] rounded-2xl overflow-hidden shadow-lg border border-gray-800"
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <Cloud className="h-6 w-6 text-blue-400 mr-3" />
                <h2 className="text-2xl font-bold text-blue-400">Upload Image</h2>
              </div>

              {!selectedFile ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="border-2 border-dashed border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center bg-[#0d0e24] cursor-pointer"
                  onClick={() => document.getElementById("file-upload").click()}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <Upload className="h-16 w-16 text-blue-500 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">Drag & drop your image here</h3>
                  <p className="text-gray-400 text-center mb-6">or click to browse your files</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-lg flex items-center"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Select Image
                  </motion.button>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-4">Supported formats: JPG, PNG, WEBP</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-[#0d0e24] rounded-xl overflow-hidden" style={{ height: "320px" }}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="h-full w-full flex items-center justify-center"
                    >
                      <img
                        ref={imageRef}
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      {detectionResult && renderAccidentOverlays()}
                    </motion.div>
                  </div>

                  <div className="flex justify-between items-center px-1 py-2">
                    <p className="text-sm text-gray-400 truncate flex-1">
                      {selectedFile.name}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClearFile}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </motion.button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDetectClick}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Detect Accident
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg flex items-start"
                >
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-gradient-to-br from-[#13142d] to-[#191a3a] rounded-2xl overflow-hidden shadow-lg border border-gray-800"
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <Activity className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-2xl font-bold text-purple-400">Detection Results</h2>
              </div>

              {!detectionResult && !loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="border-2 border-dashed border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center bg-[#0d0e24] h-96"
                >
                  <div className="bg-[#191a3a] p-4 rounded-full mb-4">
                    <Activity className="h-10 w-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Analysis Results</h3>
                  <p className="text-gray-400 text-center mb-2">
                    Upload an image and click "Detect Accident" to analyze
                  </p>
                  <div className="flex items-center mt-4 text-gray-500 text-sm">
                    <div className="flex space-x-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    </div>
                    <span className="ml-2">Detection severity indicators</span>
                  </div>
                </motion.div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <p className="mt-6 text-purple-300 font-medium">Analyzing image...</p>
                  <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {detectionResult.predictions.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-900/30 border border-green-700 text-green-300 p-4 rounded-lg flex items-center"
                    >
                      <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p>No accidents detected in this image.</p>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-lg flex items-center ${
                          detectionResult.predictions.some(p => p.class === "severe")
                            ? "bg-red-900/30 border border-red-700 text-red-300"
                            : "bg-orange-900/30 border border-orange-700 text-orange-300"
                        }`}
                      >
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Accident Detected!</p>
                          <p className="text-sm opacity-80">
                            {detectionResult.predictions.some(p => p.class === "severe")
                              ? "Severe accident conditions detected. Immediate attention required."
                              : "Potential accident detected. Careful assessment recommended."}
                          </p>
                        </div>
                      </motion.div>

                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3">Detection Details</h3>
                        <div className="space-y-3">
                          {detectionResult.predictions.map((pred, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-center justify-between bg-[#0d0e24] p-3 rounded-lg border ${
                                getSeverityColor(pred.class)
                              }`}
                            >
                              <div className="flex items-center">
                                {getSeverityIcon(pred.class)}
                                <div className="ml-3">
                                  <p className="font-medium">{pred.class}</p>
                                  <p className="text-xs text-gray-400">Detection #{index + 1}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm">
                                  {Math.round(pred.confidence * 100)}% confidence
                                </div>
                                <div className="w-24 h-2 bg-gray-700 rounded-full mt-1">
                                  <div
                                    className={`h-full rounded-full ${
                                      pred.class === "severe"
                                        ? "bg-red-500"
                                        : pred.class === "moderate"
                                        ? "bg-orange-500"
                                        : "bg-blue-500"
                                    }`}
                                    style={{ width: `${Math.round(pred.confidence * 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-[#0d0e24] p-4 rounded-lg"
                        >
                          <p className="text-sm text-gray-400">Detection Time</p>
                          <p className="text-lg font-medium">{detectionResult.time.toFixed(2)}s</p>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="bg-[#0d0e24] p-4 rounded-lg"
                        >
                          <p className="text-sm text-gray-400">Total Detections</p>
                          <p className="text-lg font-medium">{detectionResult.predictions.length}</p>
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-4 bg-[#0d0e24] p-4 rounded-lg"
                      >
                        <p className="text-sm text-gray-400">Inference ID</p>
                        <p className="text-xs text-gray-300 font-mono mt-1 truncate">
                          {detectionResult.inference_id}
                        </p>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Additional Information Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        transition={{ duration: 0.8 }}
        className="bg-[#0d0e24] py-16 mt-8"
      >
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              How It Works
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Upload Image",
                description: "Upload any image containing vehicles or accident scenes for analysis.",
                icon: <Upload className="h-8 w-8 text-blue-500" />
              },
              {
                title: "AI Analysis",
                description: "Our advanced machine learning models analyze the scene for accident indicators.",
                icon: <Activity className="h-8 w-8 text-purple-500" />
              },
              {
                title: "Get Results",
                description: "Receive detailed analysis with accident severity and locations highlighted.",
                icon: <AlertTriangle className="h-8 w-8 text-red-500" />
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-[#13142d] p-6 rounded-xl border border-gray-800 shadow-lg"
              >
                <div className="bg-[#191a3a] p-4 rounded-full inline-flex mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AccidentDetection;