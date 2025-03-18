import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/config";
import { Search } from "lucide-react";

const guides = [
  {
    id: 1,
    title: "How to Perform CPR",
    description: "Step-by-step guide to performing CPR in an emergency.",
    image: "data:image/png;base64,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",
    videoUrl: "https://www.youtube.com/embed/-NodDRTsV88"
  },
  {
    id: 2,
    title: "Heimlich Maneuver",
    description: "Learn how to help someone who is choking.",
    image: "data:image/jpeg;base64,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",
    videoUrl: "https://www.youtube.com/embed/7CgtIgSyAiU?si=F_m4jeCbUfvsbEEO"
  },
  {
    id: 3,
    title: "How to Treat a Burn",
    description: "Proper first-aid steps for minor and severe burns.",
    image: "https://via.placeholder.com/300",
    videoUrl: "https://www.youtube.com/embed/JnpHjAWE7Zw"
  },
  {
    id: 4,
    title: "How to Stop Bleeding",
    description: "Essential techniques to stop severe bleeding.",
    image: "https://via.placeholder.com/300",
    videoUrl: "https://www.youtube.com/embed/Mt6M9-WEFsE"
  },
  {
    id: 5,
    title: "How to Carry an Unconscious Person",
    description: "Safe ways to transport an unconscious individual.",
    image: "https://via.placeholder.com/300",
    videoUrl: "https://www.youtube.com/embed/mLg4S44DNio"
  },
  {
    id: 6,
    title: "How to Treat a Fracture",
    description: "Guide to immobilizing fractures and seeking medical help.",
    image: "https://via.placeholder.com/300",
    videoUrl: "https://www.youtube.com/embed/XD_2U6fbjK0"
  },
  {
    id: 7,
    title: "How to Handle a Seizure",
    description: "Steps to assist someone having a seizure.",
    image: "https://via.placeholder.com/300",
    videoUrl: "https://www.youtube.com/embed/_JlTPRCk9-k"
  },
  {
    id: 8,
    title: "How to Treat Shock",
    description: "Recognizing and managing symptoms of shock.",
    image: "https://via.placeholder.com/300",
    videoUrl: "https://www.youtube.com/embed/oE_9ohm22mU"
  },
  {
    id: 9,
    title: "How to Treat Hypothermia",
    description: "Steps to help someone with hypothermia.",
    image: "https://via.placeholder.com/300",
    videoUrl: "https://www.youtube.com/embed/N7HqKkzcsX4"
  },
  {
    id: 10,
    title: "How to Handle a Snake Bite",
    description: "What to do and what not to do after a snake bite.",
    image: "https://via.placeholder.com/300",
    videoUrl: "https://www.youtube.com/embed/9ldnTwYpRSo"
  }
];

const ContactUs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [user] = useAuthState(auth);

  const filteredGuides = guides.filter((guide) =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0b1d] text-white py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold">Emergency Medical Guides</h1>
        <p className="text-gray-400 mt-2">
          Learn crucial first-aid techniques to help in emergencies.
        </p>
      </motion.div>

      {/* Search Bar */}
      <div className="flex items-center bg-gray-800 p-3 rounded-lg mb-6 max-w-lg mx-auto">
        <Search className="text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Search guides..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent w-full focus:outline-none text-white"
        />
      </div>

      {/* Guides List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredGuides.map((guide) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 p-4 rounded-lg cursor-pointer hover:bg-gray-800 transition"
            onClick={() => setSelectedGuide(guide)}
          >
            <img src={guide.image} alt={guide.title} className="rounded-lg mb-4 w-full h-40 object-cover" />
            <h3 className="text-xl font-semibold">{guide.title}</h3>
            <p className="text-gray-400 text-sm mt-2">{guide.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Modal for Video */}
      {selectedGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => setSelectedGuide(null)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-4">{selectedGuide.title}</h2>
            <iframe
              width="560"
              height="315"
              src={selectedGuide.videoUrl}
              title={selectedGuide.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-64 rounded-lg"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;
