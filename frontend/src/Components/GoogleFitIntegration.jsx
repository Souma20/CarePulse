import React, { useState, useEffect } from 'react';
import { googleFitService } from '../googleFitService/googleFitService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GoogleFitIntegration = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [steps, setSteps] = useState([]);
  const [heartRate, setHeartRate] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await googleFitService.loadGoogleFitAPI();
        setIsAuthenticated(googleFitService.isUserAuthenticated());
      } catch (err) {
        setError('Failed to load Google Fit API');
        console.error(err);
      }
    };
    
    checkAuth();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await googleFitService.signIn();
      setIsAuthenticated(true);
    } catch (err) {
      setError('Authentication failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      await googleFitService.signOut();
      setIsAuthenticated(false);
      setSteps([]);
      setHeartRate([]);
    } catch (err) {
      setError('Sign out failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLastWeekData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      
      // Fetch step data
      const stepsResponse = await googleFitService.fetchStepData(oneWeekAgo, now);
      const stepsData = stepsResponse.result.bucket.map(bucket => {
        const startDate = new Date(parseInt(bucket.startTimeMillis));
        const dateStr = startDate.toLocaleDateString();
        
        let stepCount = 0;
        if (bucket.dataset[0].point && bucket.dataset[0].point.length > 0) {
          stepCount = bucket.dataset[0].point.reduce((total, point) => {
            return total + point.value[0].intVal;
          }, 0);
        }
        
        return { date: dateStr, steps: stepCount };
      });
      
      // Fetch heart rate data
      const heartRateResponse = await googleFitService.fetchHeartRateData(oneWeekAgo, now);
      const heartRateData = heartRateResponse.result.bucket.map(bucket => {
        const startDate = new Date(parseInt(bucket.startTimeMillis));
        const dateStr = startDate.toLocaleDateString();
        
        let avgHeartRate = 0;
        let count = 0;
        
        if (bucket.dataset[0].point && bucket.dataset[0].point.length > 0) {
          bucket.dataset[0].point.forEach(point => {
            avgHeartRate += point.value[0].fpVal;
            count++;
          });
          
          avgHeartRate = count > 0 ? Math.round(avgHeartRate / count) : 0;
        }
        
        return { date: dateStr, heartRate: avgHeartRate };
      });
      
      setSteps(stepsData);
      setHeartRate(heartRateData);
    } catch (err) {
      setError('Failed to fetch fitness data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Google Fit Integration</h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-4">
        {!isAuthenticated ? (
          <button 
            onClick={handleSignIn} 
            disabled={isLoading} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isLoading ? 'Connecting...' : 'Connect to Google Fit'}
          </button>
        ) : (
          <div className="flex space-x-4">
            <button 
              onClick={fetchLastWeekData} 
              disabled={isLoading} 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              {isLoading ? 'Loading...' : 'Fetch Last Week Data'}
            </button>
            <button 
              onClick={handleSignOut} 
              disabled={isLoading} 
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
      
      {steps.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Step Count (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={steps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="steps" stroke="#4299e1" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {heartRate.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Average Heart Rate (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={heartRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="heartRate" stroke="#f56565" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default GoogleFitIntegration;