require("dotenv").config();
const express = require("express");
const { Resend } = require("resend");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Better logging for debugging
const logRequest = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log("Request body:", req.body);
  next();
};

app.use(logRequest);

// Initialize Resend - make sure API key is valid
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error("WARNING: Missing RESEND_API_KEY in environment variables");
}

const resend = new Resend(resendApiKey);

// Default route
app.get("/", (req, res) => {
  res.send("Server is running! Use POST /api/send-email to send an alert.");
});

// Email sending endpoint with better error handling
app.post("/api/send-email", async (req, res) => {
  console.log("Received emergency email request");
  
  try {
    const { service, location, address } = req.body;
    
    // Validate incoming data
    if (!service) {
      return res.status(400).json({ error: "Missing service parameter" });
    }
    
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: "Missing or invalid location data" });
    }

    const emergencyServices = {
      police: { email: "shaalu5050@gmail.com", icon: "🚓", label: "Police" },
      ambulance: { email: "hypercore420@gmail.com", icon: "🚑", label: "Ambulance" },
      firebrigade: { email: "faizshaikh29086@gmail.com", icon: "🚒", label: "Fire Brigade" }
    };

    const serviceInfo = emergencyServices[service];
    if (!serviceInfo) {
      return res.status(400).json({ error: `Invalid service type: ${service}` });
    }

    console.log(`Sending ${serviceInfo.label} alert to ${serviceInfo.email}`);
    const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    // Log Resend API call for debugging
    console.log("Making Resend API call with params:", {
      from: "Emergency Alert <onboarding@resend.dev>",
      to: serviceInfo.email,
      subject: `EMERGENCY ALERT: ${serviceInfo.label} needed`
    });

    const { data, error } = await resend.emails.send({
      from: "Emergency Alert <onboarding@resend.dev>",
      to: [serviceInfo.email],
      reply_to: "hypercore420@gmail.com", // Add your email as reply-to
      subject: `EMERGENCY ALERT: ${serviceInfo.label} needed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #d32f2f; text-align: center;">URGENT HELP NEEDED!</h1>
          <div style="text-align: center; font-size: 24px; margin: 20px 0;">
            🚨 ${serviceInfo.icon} ${serviceInfo.label} Emergency Alert 🚨
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #333;">Location Details:</h3>
            <p style="margin-bottom: 5px;"><strong>Latitude:</strong> ${location.latitude}</p>
            <p style="margin-bottom: 5px;"><strong>Longitude:</strong> ${location.longitude}</p>
            ${address ? `<p style="margin-bottom: 5px;"><strong>Address:</strong> ${address}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${mapsLink}" style="display: inline-block; padding: 12px 24px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View on Google Maps</a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
            Sent from Emergency Response System
          </p>
        </div>
      `
    });

    // Handle error from Resend API
    if (error) {
      console.error("Resend API Error:", error);
      return res.status(500).json({ 
        error: "Failed to send alert", 
        details: error.message || "Unknown error from email service" 
      });
    }

    console.log("Email sent successfully:", data);
    res.status(200).json({ success: true, message: "Alert sent successfully" });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ 
      error: "Server error while sending alert", 
      details: error.message || "Unknown error" 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Resend API Key configuration: ${resendApiKey ? "Present" : "Missing!"}`);
});