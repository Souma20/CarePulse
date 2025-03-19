import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import PhoneVerification from "../Components/PhoneVerification"; // Ensure this component exists

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Step 1: Validate and move to phone verification
  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    setError(""); // Clear previous errors
    setStep(2); // Move to phone verification
    setLoading(false);
  };

  // Step 2: Handle phone verification and register the user
  const handlePhoneVerificationComplete = async () => {
    setPhoneVerified(true);
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        phone,
        createdAt: new Date()
      });
      
      // Navigation will be handled by the useEffect hook
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Google Sign-Up
  const handleGoogleRegister = async () => {
    setLoading(true);
    setError("");
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create user document in Firestore if it doesn't exist
      await setDoc(doc(db, 'users', result.user.uid), {
        name: result.user.displayName || '',
        email: result.user.email || '',
        phone: '',
        createdAt: new Date()
      }, { merge: true });
      
      // Navigation will be handled by the useEffect hook
    } catch (error) {
      console.error("Google registration error:", error);
      setError("Google sign-up failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Left Section */}
      <div className="flex-[0.4] hidden md:block">
        <img
          src="images/signup.jpg"
          alt="Register background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Section */}
      <div className="flex-[0.6] p-10 flex flex-col justify-center">
        <div className="flex justify-between mb-5">
          <Link to="/" className="text-gray-400 hover:text-yellow-400 transition duration-300">
            ← Back to Home
          </Link>
          <Link to="/login" className="text-gray-400 hover:text-yellow-400 transition duration-300">
            Login Now
          </Link>
        </div>

        <div className="max-w-lg w-full mx-auto">
          <h2 className="text-2xl font-semibold mb-2 text-center text-white">
            Bring Your Stories to Life
          </h2>
          <p className="text-gray-400 mb-7 text-center">Register Today</p>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          {step === 1 ? (
            // Step 1: Registration Form
            <form onSubmit={handleInitialSubmit} className="space-y-5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                required
                disabled={loading}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                required
                disabled={loading}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                required
                disabled={loading}
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  required
                  disabled={loading}
                />
                <span
                  className="absolute right-3 top-3 text-sm text-gray-400 cursor-pointer hover:text-yellow-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </span>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  required
                  disabled={loading}
                />
                <span
                  className="absolute right-3 top-3 text-sm text-gray-400 cursor-pointer hover:text-yellow-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </span>
              </div>

              <button
                type="submit"
                className="w-full p-3 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg transition duration-300 hover:from-blue-800 hover:to-blue-600 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Processing..." : "Continue to Phone Verification"}
              </button>

              <button
                type="button"
                onClick={handleGoogleRegister}
                className="w-full p-3 bg-white text-gray-800 rounded-lg transition duration-300 hover:bg-gray-100 flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={loading}
              >
                <img src="/images/google-icon.webp" alt="Google" className="w-5 h-5" />
                {loading ? "Processing..." : "Sign up with Google"}
              </button>
            </form>
          ) : (
            // Step 2: Phone Verification
            <PhoneVerification
              phoneNumber={phone}
              userData={{ name, email, phone }}
              onComplete={handlePhoneVerificationComplete}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;