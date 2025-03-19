import React, { useState, useEffect, useRef } from "react";
import { Pill, PlusCircle, Bell, Trash2, Edit, CheckCircle, Calendar, Volume2, VolumeX } from "lucide-react";
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import { firestore } from "../firebase/config";

const MedicationReminders = ({ userId, limit, showAddButton = false, fullWidth = false }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [activeAlarms, setActiveAlarms] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Form state
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [times, setTimes] = useState(["08:00"]);
  const [notes, setNotes] = useState("");
  
  // Refs for audio elements
  const alarmSound = useRef(null);
  const alarmTimers = useRef({});

  useEffect(() => {
    if (userId) {
      fetchReminders();
    }
    
    // Create audio element
    alarmSound.current = new Audio("ringtone.mp3");
    alarmSound.current.loop = true;
    
    // Cleanup function
    return () => {
      // Clear all timers when component unmounts
      Object.values(alarmTimers.current).forEach(timer => clearTimeout(timer));
      
      // Stop and cleanup audio
      if (alarmSound.current) {
        alarmSound.current.pause();
        alarmSound.current.currentTime = 0;
      }
    };
  }, [userId]);

  useEffect(() => {
    // Set up alarm timers whenever reminders change
    scheduleAlarms();
  }, [reminders, soundEnabled]);

  const scheduleAlarms = () => {
    // Clear existing timers
    Object.values(alarmTimers.current).forEach(timer => clearTimeout(timer));
    alarmTimers.current = {};
    
    // Skip if sound is disabled
    if (!soundEnabled) return;
    
    // Schedule new timers for each reminder
    reminders.forEach(reminder => {
      const nextDoseTime = getNextDoseTime(reminder);
      const now = new Date();
      const timeUntilAlarm = nextDoseTime - now;
      
      if (timeUntilAlarm > 0) {
        alarmTimers.current[reminder.id] = setTimeout(() => {
          triggerAlarm(reminder.id, reminder.medicationName);
        }, timeUntilAlarm);
      }
    });
  };

  const triggerAlarm = (reminderId, medicationName) => {
    // Only play if sound is enabled
    if (soundEnabled) {
      alarmSound.current.play();
      
      // Update state to show active alarm
      setActiveAlarms(prev => ({
        ...prev,
        [reminderId]: medicationName
      }));
      
      // Show browser notification if permission is granted
      if (Notification.permission === "granted") {
        new Notification("Medication Reminder", {
          body: `Time to take your ${medicationName}`,
          icon: "/icons/pill_icon.png"
        });
      }
    }
  };

  const dismissAlarm = (reminderId) => {
    // Remove from active alarms
    setActiveAlarms(prev => {
      const updated = {...prev};
      delete updated[reminderId];
      
      // If no more active alarms, stop the sound
      if (Object.keys(updated).length === 0) {
        alarmSound.current.pause();
        alarmSound.current.currentTime = 0;
      }
      
      return updated;
    });
    
    // Reschedule for next dose
    scheduleAlarms();
  };

  const toggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    
    // If turning off, stop any playing alarms
    if (!newSoundState && alarmSound.current) {
      alarmSound.current.pause();
      alarmSound.current.currentTime = 0;
      setActiveAlarms({});
    }
    
    // If turning on, schedule alarms
    if (newSoundState) {
      scheduleAlarms();
    }
    
    // Save preference to localStorage
    localStorage.setItem("medicationSoundEnabled", newSoundState);
    
    return newSoundState;
  };

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const remindersRef = collection(firestore, "medicationReminders");
      const q = query(remindersRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      let fetchedReminders = [];
      querySnapshot.forEach((doc) => {
        fetchedReminders.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by next dose time
      fetchedReminders.sort((a, b) => {
        const aNextTime = getNextDoseTime(a);
        const bNextTime = getNextDoseTime(b);
        return aNextTime - bNextTime;
      });
      
      if (limit) {
        fetchedReminders = fetchedReminders.slice(0, limit);
      }
      
      setReminders(fetchedReminders);
      
      // Load sound preference from localStorage
      const savedSoundPreference = localStorage.getItem("medicationSoundEnabled");
      if (savedSoundPreference !== null) {
        setSoundEnabled(savedSoundPreference === "true");
      }
      
      // Request notification permission if not granted
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNextDoseTime = (reminder) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    for (const time of reminder.times) {
      const [hours, minutes] = time.split(':');
      const doseTime = new Date(today);
      doseTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      if (doseTime > now) {
        return doseTime;
      }
    }
    
    // If all times today are in the past, get the first time tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const [hours, minutes] = reminder.times[0].split(':');
    const doseTime = new Date(tomorrowStr);
    doseTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return doseTime;
  };

  const formatNextDose = (reminder) => {
    const nextDose = getNextDoseTime(reminder);
    const now = new Date();
    const diffMs = nextDose - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m`;
    } else {
      return `${diffMins}m`;
    }
  };

  const handleAddReminder = async () => {
    try {
      const newReminder = {
        userId,
        medicationName,
        dosage,
        frequency,
        times,
        notes,
        createdAt: new Date(),
      };
      
      await addDoc(collection(firestore, "medicationReminders"), newReminder);
      resetForm();
      setShowAddModal(false);
      fetchReminders();
    } catch (error) {
      console.error("Error adding reminder:", error);
    }
  };

  const handleEditReminder = async () => {
    try {
      const reminderRef = doc(firestore, "medicationReminders", currentReminder.id);
      await updateDoc(reminderRef, {
        medicationName,
        dosage,
        frequency,
        times,
        notes,
        updatedAt: new Date(),
      });
      
      resetForm();
      setShowEditModal(false);
      setCurrentReminder(null);
      fetchReminders();
    } catch (error) {
      console.error("Error updating reminder:", error);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (window.confirm("Are you sure you want to delete this medication reminder?")) {
      try {
        const reminderRef = doc(firestore, "medicationReminders", reminderId);
        await deleteDoc(reminderRef);
        
        // Clear any active alarms for this reminder
        if (alarmTimers.current[reminderId]) {
          clearTimeout(alarmTimers.current[reminderId]);
          delete alarmTimers.current[reminderId];
        }
        
        // Remove from active alarms if currently ringing
        if (activeAlarms[reminderId]) {
          dismissAlarm(reminderId);
        }
        
        fetchReminders();
      } catch (error) {
        console.error("Error deleting reminder:", error);
      }
    }
  };

  const openEditModal = (reminder) => {
    setCurrentReminder(reminder);
    setMedicationName(reminder.medicationName);
    setDosage(reminder.dosage);
    setFrequency(reminder.frequency);
    setTimes([...reminder.times]);
    setNotes(reminder.notes || "");
    setShowEditModal(true);
  };

  const resetForm = () => {
    setMedicationName("");
    setDosage("");
    setFrequency("daily");
    setTimes(["08:00"]);
    setNotes("");
  };

  const addTimeField = () => {
    setTimes([...times, "12:00"]);
  };

  const removeTimeField = (index) => {
    if (times.length <= 1) return;
    const newTimes = [...times];
    newTimes.splice(index, 1);
    setTimes(newTimes);
  };

  const updateTime = (index, value) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${fullWidth ? 'w-full' : 'max-w-md'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Pill className="mr-2" size={20} />
          Medication Reminders
        </h2>
        <div className="flex items-center">
          <button
            onClick={toggleSound}
            className={`mr-3 text-gray-500 hover:text-gray-700 ${soundEnabled ? 'text-blue-500' : ''}`}
            title={soundEnabled ? "Sound On" : "Sound Off"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showAddButton && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <PlusCircle size={18} className="mr-1" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Active alarm notifications */}
      {Object.keys(activeAlarms).length > 0 && (
        <div className="mb-4 bg-red-100 border border-red-300 p-3 rounded-md">
          <div className="font-medium text-red-700 mb-2 flex items-center">
            <Bell size={16} className="mr-1 animate-pulse" />
            Medication Reminder
          </div>
          {Object.entries(activeAlarms).map(([id, name]) => (
            <div key={id} className="flex justify-between items-center mb-1 last:mb-0">
              <div className="text-red-700">Time to take: {name}</div>
              <button 
                onClick={() => dismissAlarm(id)}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
              >
                Take
              </button>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <p>Loading reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Bell size={40} className="mx-auto mb-2 opacity-30" />
          <p>No medication reminders set</p>
          {showAddButton && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-blue-500 hover:text-blue-700"
            >
              Add your first reminder
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="border rounded-lg p-3 hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">{reminder.medicationName}</h3>
                  <p className="text-sm text-gray-600">{reminder.dosage}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(reminder)}
                    className="text-gray-400 hover:text-blue-500"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm flex items-center">
                <Calendar size={14} className="mr-1" />
                <span className="text-gray-600">
                  {reminder.frequency === "daily" ? "Daily" : "Custom"}
                </span>
                <span className="mx-2">•</span>
                <Bell size={14} className="mr-1" />
                <span className="text-gray-600">
                  {reminder.times.join(", ")}
                </span>
              </div>
              <div className="mt-1 text-xs bg-blue-50 text-blue-700 rounded px-2 py-1 inline-block">
                Next dose in {formatNextDose(reminder)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Medication Reminder</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name
                </label>
                <input
                  type="text"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. Aspirin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g. 100mg, 1 tablet"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reminder Times
                </label>
                {times.map((time, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeTimeField(index)}
                      className="ml-2 text-red-500"
                      disabled={times.length <= 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeField}
                  className="text-blue-500 text-sm flex items-center"
                >
                  <PlusCircle size={16} className="mr-1" />
                  Add another time
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  placeholder="Additional instructions or notes"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
                className="px-4 py-2 border rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                disabled={!medicationName || !dosage || times.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              >
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reminder Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Medication Reminder</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name
                </label>
                <input
                  type="text"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reminder Times
                </label>
                {times.map((time, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeTimeField(index)}
                      className="ml-2 text-red-500"
                      disabled={times.length <= 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeField}
                  className="text-blue-500 text-sm flex items-center"
                >
                  <PlusCircle size={16} className="mr-1" />
                  Add another time
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowEditModal(false);
                  setCurrentReminder(null);
                }}
                className="px-4 py-2 border rounded-md text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEditReminder}
                disabled={!medicationName || !dosage || times.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
              >
                Update Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationReminders;