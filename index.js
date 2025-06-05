require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  "https://thomast43002.wixsite.com",
  "https://thomast43002-wixsite-com.filesusr.com",
  "http://localhost" // For local testing
];

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// ======================
// Enhanced Routes
// ======================

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "Server is running",
    endpoints: {
      root: "GET /",
      sendEmail: "POST /api/send",
      test: "GET /api/test"
    }
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.status(200).json({ 
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString()
  });
});

// Preflight route
app.options("/api/send", cors());

// Request validation middleware
const validateRequest = (req, res, next) => {
  console.log("Request body:", req.body);
  
  if (!req.body) {
    return res.status(400).json({ 
      error: "Request body is required",
      exampleRequest: {
        reservation: {
          firstName: "John",
          lastName: "Doe",
          service: "Airport Transfer",
          phone: "1234567890",
          email: "john@example.com",
          date: "2023-12-31",
          time: "14:00",
          passengers: 2,
          carSeats: 1,
          notes: "Special instructions"
        },
        contact: {
          contactName: "Jane Smith",
          contactPhone: "9876543210",
          contactEmail: "jane@example.com",
          contactMessage: "I have a question about your services"
        }
      }
    });
  }

  if (req.body.firstName) {
    if (!req.body.service || !req.body.phone || !req.body.date || !req.body.time) {
      return res.status(400).json({ 
        error: "Missing required reservation fields",
        requiredFields: ["service", "phone", "date", "time"]
      });
    }
  } else if (req.body.contactName) {
    if (!req.body.contactPhone || !req.body.contactMessage) {
      return res.status(400).json({ 
        error: "Missing required contact fields",
        requiredFields: ["contactPhone", "contactMessage"]
      });
    }
  } else {
    return res.status(400).json({ 
      error: "Invalid request format",
      acceptedFormats: ["reservation", "contact"]
    });
  }

  next();
};

// Main email endpoint
app.post("/api/send", validateRequest, async (req, res) => {
  const data = req.body;
  const isReservation = !!data.firstName;

  try {
    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email configuration missing in environment variables");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const subject = isReservation
      ? `New Reservation: ${data.service} (${data.date})`
      : `Contact Request: ${data.service || "General Inquiry"}`;

    const html = isReservation
      ? `
        <h2>🚗 Reservation Request</h2>
        <p><strong>Service:</strong> ${data.service}</p>
        <p><strong>Client:</strong> ${data.firstName} ${data.lastName || ''}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ""}
        <p><strong>Pickup:</strong> ${data.date} at ${data.time}</p>
        ${data.passengers ? `<p><strong>Passengers:</strong> ${data.passengers}</p>` : ""}
        ${data.carSeats ? `<p><strong>Car Seats:</strong> ${data.carSeats}</p>` : ""}
        ${data.notes ? `<p><strong>Notes:</strong><br>${data.notes.replace(/\n/g, "<br>")}</p>` : ""}
      `
      : `
        <h2>📩 Contact Request</h2>
        <p><strong>Name:</strong> ${data.contactName}</p>
        <p><strong>Phone:</strong> ${data.contactPhone}</p>
        ${data.contactEmail ? `<p><strong>Email:</strong> ${data.contactEmail}</p>` : ""}
        <p><strong>Message:</strong><br>${data.contactMessage.replace(/\n/g, "<br>")}</p>
      `;

    const mailOptions = {
      from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      replyTo: data.email || data.contactEmail || process.env.EMAIL_USER,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");

    res.status(200).json({ 
      success: true,
      message: "Submitted successfully!",
      data: {
        type: isReservation ? "reservation" : "contact",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Email sending error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process request",
      details: process.env.NODE_ENV !== "production" ? error.message : undefined,
      suggestion: "Please check your input and try again"
    });
  }
});

// Enhanced 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    requested: `${req.method} ${req.path}`,
    availableEndpoints: [
      { method: "GET", path: "/", description: "Server health check" },
      { method: "GET", path: "/api/test", description: "Test endpoint" },
      { method: "POST", path: "/api/send", description: "Submit contact/reservation" }
    ],
    tip: "Ensure you're using the correct HTTP method and endpoint path"
  });
});

// Server startup
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("Available endpoints:");
  console.log(`- GET http://localhost:${PORT}/`);
  console.log(`- GET http://localhost:${PORT}/api/test`);
  console.log(`- POST http://localhost:${PORT}/api/send`);
});