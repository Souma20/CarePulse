import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import ColorModeProvider from "./utils/ColorModeProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./Pages/Home";
import TextEditor from "./Pages/TextEditor";
import ImageGeneratorPage from "./Pages/ImageGeneratorPage";
import Register from "./Pages/register";
import Blog from "./Pages/Blog";
import Logi from "./Pages/login";
import ContactUs from "./Pages/ContactUs";
import GoogleFitIntegration from './components/GoogleFitIntegration';

import { auth } from './firebase/config';
import StoryGenerator from "./Pages/StoryGenerator";
import StoryFeedback from "./Pages/Feedback";
// This is a placeholder import - you'll create this component yourself
import Dashboard from "./Pages/Dashboard";

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
          </Routes>
          <Footer />
        </BrowserRouter>
      </Box>
    </ColorModeProvider>
  );
};

export default App;