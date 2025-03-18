import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/config";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const [user] = useAuthState(auth);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Logo */}
        <div className="text-white text-2xl font-bold">
          <Link to="/" className="hover:text-yellow-400 transition duration-300">
            MediConnect
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          <NavLink to="/" isActive={location.pathname === "/"}>Home</NavLink>
          <NavLink to="/appointments" isActive={location.pathname === "/appointments"}>Appointments</NavLink>
          <NavLink to="/blog" isActive={location.pathname === "/blog"}>Stories</NavLink>
          <NavLink to="/contact-us" isActive={location.pathname === "/contact-us"}>Guides</NavLink>
          {user ? (
            <button
              onClick={() => auth.signOut()}
              className="text-white hover:text-yellow-400 transition duration-300"
            >
              Logout
            </button>
          ) : (
            <NavLink to="/login" isActive={location.pathname === "/login"}>Login</NavLink>
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
          <NavLink to="/" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/"}>Home</NavLink>
          <NavLink to="/appointments" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/appointments"}>Appointments</NavLink>
          <NavLink to="/blog" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/blog"}>Stories</NavLink>
          <NavLink to="/contact-us" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/contact-us"}>Guides</NavLink>
          {user ? (
            <button
              onClick={() => {
                auth.signOut();
                setMenuOpen(false);
              }}
              className="text-white hover:text-yellow-400 transition duration-300"
            >
              Logout
            </button>
          ) : (
            <NavLink to="/login" onClick={() => setMenuOpen(false)} isActive={location.pathname === "/login"}>Login</NavLink>
          )}
        </div>
      )}

      {/* Breadcrumb Navigation */}
      
    </nav>
  );
};

const NavLink = ({ to, children, isActive, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`text-white hover:text-yellow-400 transition duration-300 ${isActive ? "border-b-2 border-yellow-400" : "border-transparent"}`}
    >
      {children}
    </Link>
  );
};

export default Header;