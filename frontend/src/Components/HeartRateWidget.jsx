import React, { useState, useEffect } from "react";
import { Heart, RefreshCw, AlertTriangle } from "lucide-react";

const HeartRateWidget = ({ isGoogleFitConnected, fullWidth = false }) => {
  const [heartRateData, setHeartRateData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentHeartRate, setCurrentHeartRate] = useState(null);
  const [error, setError] = useState(null);

  // Simulated heart rate data for demo purposes
  const generateDemoData = () => {
    setLoading(true);
    
    // Generate random heart rate data for the last 24 hours
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
      // Generate heart rate between 60-100 with some variations
      const heartRate = Math.floor(Math.random() * 20) + 65;
      data.unshift({ time, value: heartRate });
    }
    
    setTimeout(() => {
      setHeartRateData(data);
      setCurrentHeartRate(data[data.length - 1].value);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    if (isGoogleFitConnected) {
      generateDemoData();
    }
  }, [isGoogleFitConnected]);

  const refreshData = () => {
    if (isGoogleFitConnected) {
      generateDemoData();
    } else {
      setError("Please connect Google Fit to fetch heart rate data");
      setTimeout(() => setError(null), 3000);
    }
  };

  const getHeartRateColor = (rate) => {
    if (rate < 60) return "text-blue-500";
    if (rate > 100) return "text-red-500";
    return "text-green-500";
  };

  const getHeartRateStatus = (rate) => {
    if (rate < 60) return "Resting";
    if (rate >= 60 && rate <= 100) return "Normal";
    if (rate > 100 && rate <= 140) return "Elevated";
    return "High";
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${fullWidth ? "col-span-full" : ""}`}>
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Heart className="text-red-500" size={20} />
          <h2 className=" text-white text-lg font-semibold">Heart Rate</h2>
        </div>
        <button 
          onClick={refreshData}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md flex items-center space-x-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        {!isGoogleFitConnected ? (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">
              <Heart size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Connect Google Fit to see your heart rate data from Mi Band 5
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-pulse w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <Heart size={30} className="text-red-300 dark:text-red-700" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Loading heart rate data...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative mb-2">
                <div className="w-32 h-32 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
                  <div className="text-4xl font-bold" style={{ color: currentHeartRate > 100 ? '#ef4444' : '#22c55e' }}>
                    {currentHeartRate}
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  BPM
                </div>
              </div>
              <div className={`text-lg font-semibold ${getHeartRateColor(currentHeartRate)}`}>
                {getHeartRateStatus(currentHeartRate)}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">24-Hour History</h3>
              <div className="relative h-40">
                <div className="absolute inset-0 flex items-end">
                  {heartRateData.map((data, index) => {
                    const height = (data.value / 200) * 100;
                    return (
                      <div 
                        key={index}
                        className="flex-1 flex flex-col items-center justify-end"
                      >
                        <div 
                          className="w-full bg-red-400 rounded-sm mx-px"
                          style={{ 
                            height: `${height}%`,
                            opacity: index === heartRateData.length - 1 ? 1 : 0.5 + (index / heartRateData.length / 2)
                          }}
                        ></div>
                        {index % 6 === 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {data.time.getHours()}:00
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p>Average: {Math.round(heartRateData.reduce((acc, data) => acc + data.value, 0) / heartRateData.length)} BPM</p>
              <p>
                Range: {Math.min(...heartRateData.map(d => d.value))} - {Math.max(...heartRateData.map(d => d.value))} BPM
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HeartRateWidget;