import React, { useState } from 'react';
import { googleFitService } from "../googleFitService/googleFitService";

const GoogleFitTest = () => {
  const [logs, setLogs] = useState([]);
  const [apiStatus, setApiStatus] = useState('Not initialized');

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const loadApi = async () => {
    addLog('Loading Google Fit API...');
    try {
      await googleFitService.loadGoogleFitAPI();
      addLog('✅ API loaded successfully');
      setApiStatus('Loaded');
    } catch (error) {
      addLog(`❌ API loading failed: ${error}`);
      setApiStatus('Failed to load');
    }
  };

  const checkAuth = () => {
    addLog('Checking authentication status...');
    const isAuthenticated = googleFitService.isUserAuthenticated();
    addLog(`Authentication status: ${isAuthenticated ? 'Signed in' : 'Not signed in'}`);
    setApiStatus(isAuthenticated ? 'Authenticated' : 'Not authenticated');
  };

  const signIn = async () => {
    addLog('Attempting to sign in...');
    try {
      await googleFitService.signIn();
      addLog('✅ Sign in successful');
      setApiStatus('Authenticated');
    } catch (error) {
      addLog(`❌ Sign in failed: ${error}`);
    }
  };

  const signOut = async () => {
    addLog('Attempting to sign out...');
    try {
      await googleFitService.signOut();
      addLog('✅ Sign out successful');
      setApiStatus('Not authenticated');
    } catch (error) {
      addLog(`❌ Sign out failed: ${error}`);
    }
  };

  const fetchSteps = async () => {
    addLog('Fetching step data...');
    try {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const response = await googleFitService.fetchStepData(sevenDaysAgo, now);
      addLog(`✅ Step data fetched successfully`);
      console.log('Step data:', response);
    } catch (error) {
      addLog(`❌ Failed to fetch step data: ${error}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Google Fit API Test</h2>
      <div className="mb-4">
        <p className="text-lg">API Status: <span className="font-bold">{apiStatus}</span></p>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={loadApi} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Load API
        </button>
        <button onClick={checkAuth} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Check Auth
        </button>
        <button onClick={signIn} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Sign In
        </button>
        <button onClick={signOut} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Sign Out
        </button>
        <button onClick={fetchSteps} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Fetch Steps
        </button>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-medium mb-2">Logs</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet. Click buttons above to test API.</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleFitTest;