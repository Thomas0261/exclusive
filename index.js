require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// CORS configuration for Wix + Postman
const allowedOrigins = [
  "https://thomast43002.wixsite.com",
  "https://thomast43002-wixsite-com.filesusr.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// Basic test route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running." });
});

app.options("/api/send", cors()); // Preflight support

// Request validator middleware
function validateRequest(req, res, next) {
  const body = req.body;

  if (body.firstName) {
    if (!body.service || !body.phone || !body.date || !body.time) {
      return res.status(400).json({ error: "Missing required reservation fields" });
    }
  } else if (body.contactName) {
    if (!body.contactPhone || !body.contactMessage) {
      return res.status(400).json({ error: "Missing required contact fields" });
    }
  } else {
    return res.status(400).json({ error: "Invalid request format" });
  }

  next();
}

// Email route
app.post("/api/send", validateRequest, async (req, res) => {
  const data = req.body;
  const isReservation = !!data.firstName;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const subject = isReservation
    ? `🚗 New Reservation: ${data.service} (${data.date})`
    : `📩 New Contact Request`;

  const html = isReservation
    ? `
      <h3>Reservation Request</h3>
      <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Email:</strong> ${data.email || "N/A"}</p>
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.time}</p>
      <p><strong>Passengers:</strong> ${data.passengers || "-"}</p>
      <p><strong>Car Seats:</strong> ${data.carSeats || "0"}</p>
      ${data.notes ? `<p><strong>Notes:</strong><br>${data.notes.replace(/\n/g, "<br>")}</p>` : ""}
    `
    : `
      <h3>Contact Request</h3>
      <p><strong>Name:</strong> ${data.contactName}</p>
      <p><strong>Phone:</strong> ${data.contactPhone}</p>
      <p><strong>Email:</strong> ${data.contactEmail}</p>
      <p><strong>Service:</strong> ${data.service || "N/A"}</p>
      <p><strong>Message:</strong><br>${data.contactMessage.replace(/\n/g, "<br>")}</p>
    `;

  try {
    await transporter.sendMail({
      from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      subject,
      html
    });

    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Email Error:", err);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    available: ["/api/send", "/"]
  });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
