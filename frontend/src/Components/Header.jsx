import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/config";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <div className="relative text-white text-4xl md:text-4xl font-extrabold tracking-wide">
          <Link
            to="/"
            className="relative group transition duration-300 ease-in-out"
          >
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              CarePulse
            </span>
            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6 flex-grow justify-center">
          
          {/* Replace NavLink with <a> for external link */}
          <a
            href="http://localhost:3000"
            className={`text-white hover:text-yellow-400 transition duration-300 ${
              location.pathname === "/appointments" ? "border-b-2 border-yellow-400" : "border-transparent"
            }`}
          >
            Appointments
          </a>
          <NavLink to="/blog" isActive={location.pathname === "/blog"}>
            Community
          </NavLink>
          <NavLink to="/contact-us" isActive={location.pathname === "/contact-us"}>
           FirstAid Guides
          </NavLink>
          <NavLink to="/accident-detection" isActive={location.pathname === "/accident-detection"}>
            Accident Detection
          </NavLink>
          {/* Add Face Recognition NavLink */}
          <NavLink to="/face-recognition" isActive={location.pathname === "/face-recognition"}>
            Face Recognition
          </NavLink>
        </div>

        {/* Logout and Profile Button */}
        <div className="hidden md:flex items-center space-x-4">
          {loading ? (
            <span className="text-white opacity-70">Loading...</span>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="flex items-center text-white hover:text-yellow-400 transition duration-300"
              >
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <User size={20} color="black" />
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-white hover:text-yellow-400 transition duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <NavLink to="/login" isActive={location.pathname === "/login"}>
              Login
            </NavLink>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={30} /> : <Menu size={30} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/90 text-white flex flex-col space-y-4 p-4 absolute top-16 left-0 right-0 z-40">
          {/* Replace NavLink with <a> for external link */}
          <a
            href="http://localhost:3000"
            className={`text-white hover:text-yellow-400 transition duration-300 ${
              location.pathname === "/appointments" ? "border-b-2 border-yellow-400" : "border-transparent"
            }`}
            onClick={() => setMenuOpen(false)}
          >
            Appointments
          </a>
          <NavLink to="/blog" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/blog"}>
            Community
          </NavLink>
          <NavLink to="/contact-us" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/contact-us"}>
            FirstAid Guides
          </NavLink>
          <NavLink to="/accident-detection" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/accident-detection"}>
            Accident Detection
          </NavLink>
          {/* Add Face Recognition to mobile menu */}
          <NavLink to="/face-recognition" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/face-recognition"}>
            Face Recognition
          </NavLink>
          {loading ? (
            <span className="text-white opacity-70">Loading...</span>
          ) : user ? (
            <div className="flex flex-col space-y-4">
              <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/dashboard"}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <User size={20} color="black" />
                  </div>
                  <span>Dashboard</span>
                </div>
              </NavLink>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="text-white hover:text-yellow-400 transition duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <NavLink to="/login" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/login"}>
              Login
            </NavLink>
          )}
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, children, isActive, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`text-white hover:text-yellow-400 transition duration-300 ${
        isActive ? "border-b-2 border-yellow-400" : "border-transparent"
      }`}
    >
      {children}
    </Link>
  );
};

export default Header;