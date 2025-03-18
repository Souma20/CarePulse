import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, AlertTriangle } from "lucide-react";

const StressLevelWidget = ({ isGoogleFitConnected, fullWidth = false }) => {
  const [stressData, setStressData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentStressLevel, setCurrentStressLevel] = useState(null);
  const [error, setError] = useState(null);

  // Simulated stress level data for demo purposes
  const generateDemoData = () => {
    setLoading(true);
    
    // Generate random stress level data for the last 24 hours
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
      // Generate stress level between 0-100
      const stressLevel = Math.floor(Math.random() * 80);
      data.unshift({ time, value: stressLevel });
    }
    
    setTimeout(() => {
      setStressData(data);
      setCurrentStressLevel(data[data.length - 1].value);
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
      setError("Please connect Google Fit to fetch stress level data");
      setTimeout(() => setError(null), 3000);
    }
  };

  const getStressColor = (level) => {
    if (level < 30) return "text-green-500";
    if (level < 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStressStatus = (level) => {
    if (level < 30) return "Low";
    if (level < 60) return "Moderate";
    if (level < 80) return "High";
    return "Very High";
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${fullWidth ? "col-span-full" : ""}`}>
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Activity className="text-purple-500" size={20} />
          <h2 className="text-lg font-semibold">Stress Level</h2>
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
              <Activity size={48} className="mx-auto" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Connect Google Fit to see your stress level data from Mi Band 5
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-pulse w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
              <Activity size={30} className="text-purple-300 dark:text-purple-700" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Loading stress data...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative mb-2">
                <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 p-2">
                  <div className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        className="dark:opacity-20"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={currentStressLevel < 30 ? "#10b981" : currentStressLevel < 60 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="8"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * currentStressLevel) / 100}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold">{currentStressLevel}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`text-lg font-semibold ${getStressColor(currentStressLevel)}`}>
                {getStressStatus(currentStressLevel)} Stress
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">24-Hour History</h3>
              <div className="relative h-40 mt-2">
                <div className="absolute inset-0 flex items-end">
                  {stressData.map((data, index) => {
                    const height = (data.value / 100) * 100;
                    let barColor;
                    if (data.value < 30) barColor = "bg-green-400";
                    else if (data.value < 60) barColor = "bg-yellow-400";
                    else barColor = "bg-red-400";
                    
                    return (
                      <div 
                        key={index}
                        className="flex-1 flex flex-col items-center justify-end"
                      >
                        <div 
                          className={`w-full ${barColor} rounded-sm mx-px`}
                          style={{ 
                            height: `${height}%`,
                            opacity: index === stressData.length - 1 ? 1 : 0.5 + (index / stressData.length / 2)
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
              <p>Today's Average: {Math.round(stressData.reduce((acc, data) => acc + data.value, 0) / stressData.length)}</p>
              <p className="mt-1">
                Based on your heart rate variability and movement patterns
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StressLevelWidget;