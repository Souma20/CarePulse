import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import ColorModeProvider from "./utils/ColorModeProvider";
import ProtectedRoute from "./Components/ProtectedRoute";
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import Home from "./Pages/Home";
import TextEditor from "./Pages/TextEditor";
import ImageGeneratorPage from "./Pages/ImageGeneratorPage";
import Register from "./Pages/register";
import Blog from "./Pages/Blog";
import Logi from "./Pages/login";
import ContactUs from "./Pages/ContactUs";
import GoogleFitIntegration from './Components/GoogleFitIntegration';
import { auth } from './firebase/config';
import StoryGenerator from "./Pages/StoryGenerator";
import StoryFeedback from "./Pages/Feedback";
import Dashboard from "./Pages/Dashboard";
import AccidentDetection from "./Pages/AccidentDetection";
import FaceRecognition from "./Pages/FaceRecognition";

// Import the new VideoCall page
import VideoCall from "./Pages/VideoCall";

console.log('App component rendering');

const App = () => {
  return (
    <ColorModeProvider>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          color: "text.primary",
          transition: "background-color 0.3s, color 0.3s",
        }}
      >
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route
              path="/contact-us"
              element={
                <ProtectedRoute>
                  <ContactUs />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/image-generator" 
              element={
                <ProtectedRoute>
                  <ImageGeneratorPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/text-editor" element={<TextEditor />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Logi />} />              
            <Route path="/generate-images" element={<ImageGeneratorPage />} />
            <Route path="/ambulance-tracker" element={<StoryGenerator />} />
            <Route path="/feedback" element={<StoryFeedback />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/accident-detection" element={<AccidentDetection />} />
            <Route path="/face-recognition" element={<FaceRecognition />} />
            {/* New route for video call */}
            <Route path="/video-call" element={<VideoCall />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </Box>
    </ColorModeProvider>
  );
};

export default App;