require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// ✅ CORRECT: CORS configuration for Wix + Render
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
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// ✅ Preflight route explicitly for /api/send
app.options('/api/send', cors());

// ✅ Middleware to validate incoming request data
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

// ✅ Main POST endpoint
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

  const subject = isReservation
    ? `New Reservation: ${data.service} (${data.date})`
    : `Contact Request: ${data.service || "General Inquiry"}`;

  const html = isReservation
    ? `
      <h2>🚗 Reservation Request</h2>
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Client:</strong> ${data.firstName} ${data.lastName}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ""}
      <p><strong>Pickup:</strong> ${data.date} at ${data.time}</p>
      <p><strong>Passengers:</strong> ${data.passengers}</p>
      ${data.carSeats > 0 ? `<p><strong>Car Seats:</strong> ${data.carSeats}</p>` : ""}
      ${data.notes ? `<p><strong>Notes:</strong><br>${data.notes.replace(/\n/g, "<br>")}</p>` : ""}
    `
    : `
      <h2>📩 Contact Request</h2>
      <p><strong>Name:</strong> ${data.contactName}</p>
      <p><strong>Phone:</strong> ${data.contactPhone}</p>
      <p><strong>Email:</strong> ${data.contactEmail}</p>
      <p><strong>Message:</strong><br>${data.contactMessage.replace(/\n/g, "<br>")}</p>
    `;

  try {
    await transporter.sendMail({
      from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      replyTo: data.email || data.contactEmail,
      subject,
      html
    });

    console.log("✅ Email sent:", subject);
    res.status(200).json({ success: true, message: "Submitted successfully!" });
  } catch (err) {
    console.error("❌ Email error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to send email",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

// ✅ Correct port for Render (use 10000 only for local dev if needed)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
