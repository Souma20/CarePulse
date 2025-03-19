import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

// Main component that renders the entire doctor video call system
const VideoCall = () => {
  // State for managing the video call
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isPeerReady, setIsPeerReady] = useState(false);
  
  // Test mode states
  const [testMode, setTestMode] = useState(false);
  const [testDoctorId, setTestDoctorId] = useState('');
  const [customDoctorId, setCustomDoctorId] = useState('');
  
  // Refs for video elements and peer connection
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  
  // Sample doctor data - in a real app, this would come from an API
  const doctors = [
    {
      id: 'doctor-1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      experience: '12 years',
      rating: 4.9,
      availability: 'Available Now',
      image: 'https://i.pravatar.cc/150?img=1',
      peerId: 'doctor-peer-1' // This would be managed by your backend in a real app
    },
    {
      id: 'doctor-2',
      name: 'Dr. Michael Chen',
      specialty: 'Neurologist',
      experience: '8 years',
      rating: 4.7,
      availability: 'Available in 10 min',
      image: 'https://i.pravatar.cc/150?img=3',
      peerId: 'doctor-peer-2'
    },
    {
      id: 'doctor-3',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Pediatrician',
      experience: '15 years',
      rating: 4.8,
      availability: 'Available Now',
      image: 'https://i.pravatar.cc/150?img=5',
      peerId: 'doctor-peer-3'
    },
    {
      id: 'doctor-4',
      name: 'Dr. James Wilson',
      specialty: 'Orthopedic Surgeon',
      experience: '10 years',
      rating: 4.6,
      availability: 'Available in 30 min',
      image: 'https://i.pravatar.cc/150?img=8',
      peerId: 'doctor-peer-4'
    }
  ];

  // Effect to load PeerJS script dynamically
  useEffect(() => {
    const loadPeerJSScript = () => {
      return new Promise((resolve, reject) => {
        // Check if the script is already loaded
        if (window.Peer) {
          resolve();
          return;
        }

        // Create script element to load PeerJS
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.4.7/peerjs.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load PeerJS script"));
        document.body.appendChild(script);
      });
    };

    loadPeerJSScript()
      .then(() => {
        setIsPeerReady(true);
      })
      .catch(err => {
        setError("Failed to load video call capabilities. Please try again later.");
        console.error("PeerJS loading error:", err);
      });
      
    // Cleanup function to handle component unmounting
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  // Effect to set up a test doctor peer when in test mode
  useEffect(() => {
    if (testMode && window.Peer && !peerRef.current) {
      const doctorId = `doctor-test-${Math.floor(Math.random() * 1000000)}`;
      setTestDoctorId(doctorId);
      
      // For local testing, we'll use the local PeerJS server
      // Update this to match your server config (localhost or cloud)
      const peer = new window.Peer(doctorId, {
        // If you're using a local PeerJS server, uncomment these lines:
        // host: 'localhost',
        // port: 9000,
        // path: '/',
        
        // If using the cloud service, keep these lines:
        config: {
          'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        },
        debug: 3
      });
      
      peerRef.current = peer;
      
      peer.on('open', (id) => {
        console.log('Doctor peer ready with ID:', id);
      });
      
      peer.on('call', async (call) => {
        console.log('Incoming call from patient');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          call.answer(stream);
          connectionRef.current = call;
          
          call.on('stream', (patientStream) => {
            setRemoteStream(patientStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = patientStream;
            }
          });
          
          setInCall(true);
          setLoading(false);
        } catch (err) {
          console.error('Failed to get doctor media:', err);
        }
      });
    }
    
    return () => {
      if (testMode && peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [testMode]);

  // Initialize user media and setup call
  const initializeCall = async (doctor) => {
    if (!isPeerReady) {
      setError("Video call system is not ready yet. Please try again in a moment.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setCurrentDoctor(doctor);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create a unique patient ID
      const patientId = `patient-${Math.floor(Math.random() * 1000000)}`;
      
      // Initialize Peer connection with proper error handling
      // In a real application, you would handle authentication and use a dedicated server
      const peer = new window.Peer(patientId, {
        // For local testing, we'll use the local PeerJS server
        // Update this to match your server config (localhost or cloud)
        
        // If you're using a local PeerJS server, uncomment these lines:
        // host: 'localhost',
        // port: 9000,
        // path: '/',
        
        // If using the cloud service, keep these lines:
        config: {
          'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        },
        debug: 3 // Set debug level (0-3)
      });

      peerRef.current = peer;

      // Handle errors
      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        // Handle specific error types
        if (err.type === 'network' || err.type === 'peer-unavailable') {
          setError('Doctor is unavailable or network issues detected. Please try again later.');
        } else if (err.type === 'disconnected') {
          setError('Connection lost. Please check your internet connection.');
        } else {
          setError(`Connection error: ${err.message}`);
        }
        endCall();
      });

      // When peer is ready
      peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        // Only start the call once the peer connection is established
        startCall(doctor.peerId, stream);
      });

      // Handle incoming calls (in case doctor calls patient)
      peer.on('call', (call) => {
        // Answer the call and pass our local stream
        call.answer(stream);
        connectionRef.current = call;
        
        // Set up listener for remote stream
        call.on('stream', (remoteVideoStream) => {
          setRemoteStream(remoteVideoStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteVideoStream;
          }
        });
        
        // Handle call close
        call.on('close', () => {
          endCall();
        });
        
        // Handle call errors
        call.on('error', (err) => {
          console.error('Call error:', err);
          setError('Call error. Please try again.');
          endCall();
        });
        
        setInCall(true);
        setLoading(false);
      });
      
      // Handle disconnection
      peer.on('disconnected', () => {
        console.log('Peer disconnected');
        setError('Connection lost. Attempting to reconnect...');
        
        // Try to reconnect
        peer.reconnect();
      });
      
      // Handle close
      peer.on('close', () => {
        console.log('Peer connection closed');
        endCall();
      });
      
    } catch (err) {
      console.error('Error setting up call:', err);
      
      // Handle permissions error specifically
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera and microphone access denied. Please allow access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('Camera or microphone not found. Please check your devices.');
      } else {
        setError('Failed to access camera and microphone. Please ensure they are connected and permissions are granted.');
      }
      
      setLoading(false);
    }
  };

  // Function to initiate call to doctor
  const startCall = (doctorPeerId, stream) => {
    try {
      // Check if peer connection is ready
      if (!peerRef.current) {
        throw new Error('Peer connection not initialized');
      }
      
      // Set up connection options
      const callOptions = {
        metadata: {
          callType: 'patient-to-doctor',
          patientId: peerRef.current.id
        },
        // Set reliable mode for data channels
        reliable: true
      };
      
      // Call the doctor
      const call = peerRef.current.call(doctorPeerId, stream, callOptions);
      
      if (!call) {
        throw new Error('Failed to establish call');
      }
      
      connectionRef.current = call;
      
      // Set up timeout for call connection
      const connectionTimeout = setTimeout(() => {
        if (!remoteStream) {
          setError('Doctor did not answer. Please try again later.');
          endCall();
        }
      }, 30000); // 30 seconds timeout
      
      // When we receive the doctor's stream
      call.on('stream', (remoteVideoStream) => {
        clearTimeout(connectionTimeout);
        setRemoteStream(remoteVideoStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteVideoStream;
        }
        setInCall(true);
        setLoading(false);
      });
      
      // Handle call close
      call.on('close', () => {
        clearTimeout(connectionTimeout);
        endCall();
      });
      
      // Handle call errors
      call.on('error', (err) => {
        clearTimeout(connectionTimeout);
        console.error('Call error:', err);
        setError('Call error. Please try again.');
        endCall();
      });
      
    } catch (err) {
      console.error('Error during call:', err);
      setError('Failed to connect. Please try again.');
      setLoading(false);
    }
  };

  // Function to end the call
  const endCall = () => {
    // Close the connection
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    
    // Stop all tracks in the local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    // Clean up the peer connection
    if (peerRef.current && peerRef.current.disconnected === false) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    setInCall(false);
    setCurrentDoctor(null);
    setLoading(false);
    
    // Keep test mode active but reset peer connection so it can be recreated
    if (testMode) {
      peerRef.current = null;
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Render test controls
  const renderTestControls = () => {
    if (!inCall) {
      return (
        <div className="mt-8 p-4 border border-gray-300 rounded">
          <h3 className="font-bold mb-2">Simulation Controls</h3>
          <label className="block mb-2">
            <input 
              type="checkbox" 
              checked={testMode} 
              onChange={e => setTestMode(e.target.checked)}
              className="mr-2"
            />
            Act as Doctor (for testing)
          </label>
          
          {testMode && (
            <div className="p-4 bg-gray-100">
              <p>Your doctor ID: <strong>{testDoctorId}</strong></p>
              <p className="text-sm text-gray-600 mt-2">
                Use this ID in the patient window to connect.
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Render custom doctor ID input
  const renderCustomDoctorIdInput = () => {
    return (
      <div className="mb-8 p-4 border border-gray-300 rounded">
        <h3 className="font-bold mb-2">Connect to Test Doctor</h3>
        <div className="flex">
          <input
            type="text"
            value={customDoctorId}
            onChange={e => setCustomDoctorId(e.target.value)}
            placeholder="Enter doctor's test ID"
            className="flex-grow p-2 border border-gray-300 rounded-l"
          />
          <button
            onClick={() => {
              if (customDoctorId) {
                initializeCall({
                  id: 'test-doctor',
                  name: 'Test Doctor',
                  specialty: 'Test Specialty',
                  peerId: customDoctorId
                });
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-r"
          >
            Connect
          </button>
        </div>
      </div>
    );
  };

  // Render doctor cards with call button
  const renderDoctorCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="relative overflow-hidden bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:transform"
          >
            {/* Availability indicator */}
            <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold ${
              doctor.availability.includes('Now') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {doctor.availability}
            </div>
            
            {/* Doctor image */}
            <div className="h-48 overflow-hidden">
              <img 
                src="/api/placeholder/150/150" 
                alt={doctor.name} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>

            {/* Doctor info */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{doctor.name}</h3>
              <p className="text-indigo-600 font-medium mb-2">{doctor.specialty}</p>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center mr-4">
                  <span className="text-sm text-gray-600">Experience:</span>
                  <span className="ml-1 text-sm font-medium">{doctor.experience}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Rating:</span>
                  <div className="flex items-center ml-1">
                    <span className="text-sm font-medium">{doctor.rating}</span>
                    <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Call button */}
              <button
                onClick={() => initializeCall(doctor)}
                disabled={inCall || loading}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                  inCall || loading
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <Phone className="w-5 h-5 mr-2" />
                {inCall 
                  ? 'In Another Call' 
                  : loading 
                  ? 'Connecting...' 
                  : 'Start Video Call'}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render call interface
  const renderCallInterface = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
        {/* Call header */}
        <div className="p-4 bg-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/api/placeholder/40/40" 
              alt={currentDoctor?.name || 'Test User'} 
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h3 className="text-white font-medium">{currentDoctor?.name || (testMode ? 'Patient' : 'Test Doctor')}</h3>
              <p className="text-gray-400 text-sm">{currentDoctor?.specialty || (testMode ? 'Patient Call' : 'Test Call')}</p>
            </div>
          </div>
          <div className="text-white text-sm">
            <span className="bg-red-600 px-2 py-1 rounded-full animate-pulse">
              Live Call
            </span>
          </div>
        </div>
        
        {/* Video container */}
        <div className="flex-grow flex flex-col md:flex-row relative">
          {/* Remote video (doctor) - larger */}
          <div className="flex-grow bg-gray-800 relative">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Connecting to {testMode ? 'patient' : 'doctor'}...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Local video (patient) - smaller, overlaid */}
          <div className="absolute bottom-4 right-4 w-48 h-36 md:w-1/4 md:h-1/4 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted // Must be muted to avoid feedback
              className="w-full h-full object-cover"
            />
            {!videoEnabled && (
              <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center">
                <p className="text-white text-sm">Camera Off</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Call controls */}
        <div className="p-4 bg-gray-900 flex items-center justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full ${audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
            aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {audioEnabled ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
            aria-label={videoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {videoEnabled ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </button>
          
          <button
            onClick={endCall}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-full"
            aria-label="End call"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Connection status */}
        {error && (
          <div className="p-2 bg-red-600 text-white text-center">
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Connect with Specialists</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Schedule a video consultation with top doctors in their fields. 
            Get expert medical advice from the comfort of your home.
          </p>
        </div>
        
        {/* Simulation controls */}
        {!inCall && renderTestControls()}
        
        {/* Custom doctor ID input for test connections */}
        {!inCall && !testMode && renderCustomDoctorIdInput()}
        
        {/* Error message */}
        {error && !inCall && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        {/* Doctor cards */}
        {!inCall && !testMode && renderDoctorCards()}
        
        {/* Call interface */}
        {inCall && renderCallInterface()}
      </div>
    </div>
  );
};

export default VideoCall;