import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw, FileText, Loader } from "lucide-react";
import { Client } from "@gradio/client";

const ImageGeneratorPage = () => {
  // State variables
  const [symptomText, setSymptomText] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Example symptoms for quick selection
  const exampleSymptoms = [
    "I have no interest in physical activity. I am always thirsty",
    "I am freezing",
    "My eyes are pale",
  ];

  // Clear the input and diagnosis
  const handleClear = () => {
    setSymptomText("");
    setDiagnosisResult(null);
    setError(null);
  };

  // Submit the symptom text to the API using Gradio client
  const handleSubmit = async () => {
    if (!symptomText) return;
    setLoading(true);
    setError(null);

    try {
      // Connect to the Hugging Face Space
      const client = await Client.connect("segadeds/Medical_Diagnosis");
      // Call the /predict endpoint with the symptom text
      const result = await client.predict("/predict", { txt: symptomText });

      console.log("API Response:", result); // Debugging output

      // Extract the correct response structure
      if (result?.data && result.data.length > 0) {
        setDiagnosisResult(result.data[0]); // Extract first result
      } else {
        setError("No diagnosis results found.");
      }
    } catch (err) {
      console.error("Error getting diagnosis:", err);
      setError("Failed to get diagnosis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b1d] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 mt-12"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Medical <span className="text-yellow-400">Diagnosis</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Describe your symptoms in detail to get a preliminary AI-powered
          medical assessment.
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Panel: Input Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-1/2 bg-gray-900/50 p-6 rounded-xl border border-gray-800"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-white mb-2">
                Describe how you feel in great detail
              </label>
              <textarea
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                placeholder="Enter your symptoms here..."
                className="w-full h-32 bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Example Symptoms */}
            <div className="flex flex-wrap gap-2">
              <p className="text-gray-400 w-full">Examples:</p>
              {exampleSymptoms.map((symptom, index) => (
                <button
                  key={index}
                  onClick={() => setSymptomText(symptom)}
                  className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm hover:bg-gray-700 transition"
                >
                  {symptom}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleClear}
                className="w-1/2 bg-gray-700 text-white py-4 rounded-lg hover:bg-gray-600 transition duration-300 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Clear</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !symptomText}
                className="w-1/2 bg-gradient-to-r from-blue-900 to-blue-700 text-white py-4 rounded-lg hover:from-blue-800 hover:to-blue-600 transition duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Diagnosis Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-1/2 bg-gray-900/30 p-6 rounded-xl border border-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-white font-semibold">
              Diagnosis Results
            </h2>
            <FileText className="w-6 h-6 text-gray-400" />
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-900/30 p-4 rounded-lg border border-red-800">
              <p className="text-red-300">{error}</p>
            </div>
          ) : diagnosisResult ? (
            <div className="space-y-4">
              {/* Primary Diagnosis */}
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800">
                <h3 className="text-white font-medium mb-2">
                  Primary Diagnosis
                </h3>
                <p className="text-yellow-300 text-lg">{diagnosisResult.label}</p>
              </div>

              {/* Possible Conditions */}
              {diagnosisResult.confidences &&
                diagnosisResult.confidences.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-2">
                      Possible Conditions
                    </h3>
                    <div className="space-y-2">
                      {diagnosisResult.confidences.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center"
                        >
                          <span className="text-gray-300">{item.label}</span>
                          <div className="flex items-center">
                            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-500 rounded-full"
                                style={{
                                  width: `${(item.confidence || 0) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-gray-400 ml-2">
                              {Math.round((item.confidence || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p>Your diagnosis results will appear here</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ImageGeneratorPage;
