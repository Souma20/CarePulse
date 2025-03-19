import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Heart, Activity, Clock, Zap } from "lucide-react";

const HealthSummary = ({ isGoogleFitConnected = false, userId }) => {
  const [healthData, setHealthData] = useState({
    averageHeartRate: "--",
    stressLevel: "--",
    steps: "--",
    calories: "--",
    loading: true
  });

  useEffect(() => {
    // In a real application, this would fetch data from Google Fit API
    // or from your Firebase database where you store the synced data
    const fetchHealthData = async () => {
      if (isGoogleFitConnected) {
        try {
          // Mock data for demonstration
          // In production, replace with actual API calls to Google Fit
          setTimeout(() => {
            setHealthData({
              averageHeartRate: Math.floor(Math.random() * 20) + 65, // 65-85 bpm
              stressLevel: Math.floor(Math.random() * 30) + 20, // 20-50
              steps: Math.floor(Math.random() * 5000) + 3000, // 3000-8000 steps
              calories: Math.floor(Math.random() * 500) + 1000, // 1000-1500 calories
              loading: false
            });
          }, 1000);
        } catch (error) {
          console.error("Error fetching health data:", error);
          setHealthData(prev => ({ ...prev, loading: false }));
        }
      } else {
        setHealthData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchHealthData();
    
    // In a production app, you might want to set up a polling interval
    // to refresh the data periodically
    const intervalId = setInterval(() => {
      if (isGoogleFitConnected) {
        fetchHealthData();
      }
    }, 300000); // Update every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [isGoogleFitConnected, userId]);

  // Calculate health score based on the metrics (simplified version)
  const calculateHealthScore = () => {
    if (!isGoogleFitConnected || healthData.averageHeartRate === "--") {
      return "--";
    }
    
    // This is a simplified scoring algorithm
    // In a real application, you would use more sophisticated methods
    const heartRateScore = healthData.averageHeartRate >= 60 && healthData.averageHeartRate <= 80 ? 25 : 15;
    const stressScore = healthData.stressLevel <= 30 ? 25 : 15;
    const stepScore = healthData.steps >= 5000 ? 25 : 15;
    const calorieScore = healthData.calories >= 1200 ? 25 : 15;
    
    return Math.min(100, heartRateScore + stressScore + stepScore + calorieScore);
  };

  const healthScore = calculateHealthScore();
  const isGoodScore = healthScore !== "--" && healthScore >= 75;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className={`px-6 py-4 ${isGoodScore ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Health Summary</h2>
          <span className="text-sm opacity-75">Today</span>
        </div>
        <div className="mt-2 flex items-center">
          <div className="text-3xl font-bold mr-3">
            {healthScore === "--" ? "--" : `${healthScore}/100`}
          </div>
          {healthScore !== "--" && (
            <div className="flex items-center text-white text-sm">
              {isGoodScore ? (
                <>
                  <TrendingUp size={16} className="mr-1" />
                  Good
                </>
              ) : (
                <>
                  <TrendingDown size={16} className="mr-1" />
                  Fair
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {!isGoogleFitConnected ? (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">
              Connect Google Fit to see your health summary
            </p>
          </div>
        ) : healthData.loading ? (
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        ) : (
          <div className=" text-white grid grid-cols-2 gap-4">
            <MetricCard 
              icon={<Heart size={20} className="text-red-500" />}
              name="Avg Heart Rate"
              value={`${healthData.averageHeartRate} bpm`}
              trend={healthData.averageHeartRate < 75 ? "good" : "neutral"}
            />
            
            <MetricCard 
              icon={<Activity size={20} className="text-orange-500" />}
              name="Stress Level"
              value={`${healthData.stressLevel}%`}
              trend={healthData.stressLevel < 30 ? "good" : "warning"}
            />
            
            <MetricCard 
              icon={<Zap size={20} className="text-blue-500" />}
              name="Steps"
              value={healthData.steps.toLocaleString()}
              trend={healthData.steps > 5000 ? "good" : "neutral"}
            />
            
            <MetricCard 
              icon={<Clock size={20} className="text-green-500" />}
              name="Calories"
              value={`${healthData.calories} cal`}
              trend="neutral"
            />
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {isGoogleFitConnected ? (
            <div className="flex justify-between">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <button className="text-blue-500 hover:text-blue-700">Refresh</button>
            </div>
          ) : (
            <span>Connect your Mi Band 5 via Google Fit to track these metrics</span>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, name, value, trend }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "good":
        return <TrendingUp size={16} className="text-green-500" />;
      case "warning":
        return <TrendingUp size={16} className="text-orange-500" />;
      case "bad":
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="mr-3 bg-white dark:bg-gray-700 p-2 rounded-full">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{name}</div>
        <div className="font-semibold flex items-center">
          {value}
          {getTrendIcon() && <span className="ml-1">{getTrendIcon()}</span>}
        </div>
      </div>
    </div>
  );
};

export default HealthSummary;