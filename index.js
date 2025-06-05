require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// CORS setup for Wix
const allowedOrigin = "https://thomast43002.wixsite.com";
app.use(cors({
  origin: allowedOrigin,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Preflight handler
app.options('/api/send', cors());

app.use(express.json());

// Middleware to validate request
const validateRequest = (req, res, next) => {
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
};

// API handler
app.post("/api/send", validateRequest, async (req, res) => {
  const data = req.body;
  const isReservation = !!data.firstName;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });

  const emailSubject = isReservation
    ? `New Reservation: ${data.service} (${data.date})`
    : `Contact Request: ${data.service || "General Inquiry"}`;

  const plainText = isReservation
    ? `New reservation from ${data.firstName} ${data.lastName}, Phone: ${data.phone}, Service: ${data.service}, Pickup: ${data.date} ${data.time}`
    : `Contact request from ${data.contactName}, Phone: ${data.contactPhone}, Message: ${data.contactMessage}`;

  const emailHtml = isReservation
    ? `
      <h2>🚗 New Reservation Request</h2>
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Client:</strong> ${data.firstName} ${data.lastName}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ""}
      <p><strong>Date/Time:</strong> ${data.date} at ${data.time}</p>
      <p><strong>Passengers:</strong> ${data.passengers}</p>
      ${data.carSeats > 0 ? `<p><strong>Car Seats:</strong> ${data.carSeats}</p>` : ""}
      ${data.notes ? `<p><strong>Notes:</strong><br>${data.notes.replace(/\n/g, "<br>")}</p>` : ""}
    `
    : `
      <h2>📩 New Contact Request</h2>
      <p><strong>From:</strong> ${data.contactName}</p>
      <p><strong>Phone:</strong> ${data.contactPhone}</p>
      <p><strong>Email:</strong> ${data.contactEmail}</p>
      ${data.service ? `<p><strong>Service:</strong> ${data.service}</p>` : ""}
      <p><strong>Message:</strong><br>${data.contactMessage.replace(/\n/g, "<br>")}</p>
    `;

  try {
    await transporter.sendMail({
      from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      replyTo: data.email || data.contactEmail,
      subject: emailSubject,
      text: plainText,
      html: emailHtml
    });

    console.log(`✅ Email sent: ${emailSubject}`);
    res.status(200).json({ success: true, message: "Your request has been submitted successfully!" });
  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to process your request",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
