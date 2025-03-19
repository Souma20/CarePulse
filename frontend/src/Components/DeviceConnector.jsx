import React, { useState } from "react";
import { Watch, Smartphone, Laptop, Trash2, PlusCircle, CheckCircle, Info } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/config";

const DeviceConnector = ({ userId, connectedDevices = [], setConnectedDevices, fullWidth = false }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    type: "smartwatch",
    name: "",
    model: ""
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const deviceIcons = {
    smartwatch: <Watch size={24} />,
    smartphone: <Smartphone size={24} />,
    laptop: <Laptop size={24} />
  };
  
  const deviceTypes = [
    { value: "smartwatch", label: "Smartwatch" },
    { value: "smartphone", label: "Smartphone" },
    { value: "laptop", label: "Laptop/Desktop" }
  ];

  const addDevice = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      if (!newDevice.name || !newDevice.model) {
        throw new Error("Please enter both name and model");
      }
      
      // In a real application, this would include device pairing logic
      const deviceToAdd = {
        ...newDevice,
        id: `device_${Date.now()}`,
        connectedAt: new Date()
      };
      
      const updatedDevices = [...connectedDevices, deviceToAdd];
      
      // Update in Firestore
      await updateDoc(doc(firestore, "users", userId), {
        connectedDevices: updatedDevices
      });
      
      // Update local state
      setConnectedDevices(updatedDevices);
      setShowAddModal(false);
      setNewDevice({
        type: "smartwatch",
        name: "",
        model: ""
      });
      
    } catch (err) {
      console.error("Error connecting device:", err);
      setError(err.message || "Failed to connect device");
    } finally {
      setConnecting(false);
    }
  };

  const removeDevice = async (deviceId) => {
    if (window.confirm("Are you sure you want to remove this device?")) {
      try {
        const updatedDevices = connectedDevices.filter(device => device.id !== deviceId);
        
        // Update in Firestore
        await updateDoc(doc(firestore, "users", userId), {
          connectedDevices: updatedDevices
        });
        
        // Update local state
        setConnectedDevices(updatedDevices);
        
      } catch (err) {
        console.error("Error removing device:", err);
        alert("Failed to remove device");
      }
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="flex justify-between items-center mb-6 text-white">
        <h2 className="text-xl font-semibold flex items-center">
          <Watch className="mr-2" size={22} />
          Connected Devices
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1 text-blue-500 hover:text-blue-700 transition"
        >
          <PlusCircle size={18} />
          <span>Add Device</span>
        </button>
      </div>

      {connectedDevices.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 text-white dark:border-gray-700 rounded-lg">
          <Watch size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium mb-1">No devices connected</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Connect your fitness trackers and devices</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Connect Device
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connectedDevices.map(device => (
            <div 
              key={device.id}
              className="flex items-center justify-between border p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  {deviceIcons[device.type] || <Watch size={24} />}
                </div>
                <div>
                  <h3 className="font-medium text-white">{device.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{device.model}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="flex items-center text-green-500 text-sm">
                  <CheckCircle size={16} className="mr-1" />
                  Connected
                </span>
                <button
                  onClick={() => removeDevice(device.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg flex items-start space-x-3">
            <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              For Mi Band 5 users: Connect your device through the Zepp app and then link your account with Google Fit to 
              enable heart rate and stress level tracking in CarePulse.
            </p>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Connect New Device</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Device Type
                </label>
                <select
                  value={newDevice.type}
                  onChange={(e) => setNewDevice({...newDevice, type: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700"
                >
                  {deviceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="e.g. My Mi Band 5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={newDevice.model}
                  onChange={(e) => setNewDevice({...newDevice, model: e.target.value})}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="e.g. Mi Smart Band 5"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/30 rounded">
                  {error}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError(null);
                }}
                className="px-4 py-2 border dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={addDevice}
                disabled={connecting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition"
              >
                {connecting ? "Connecting..." : "Connect Device"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceConnector;