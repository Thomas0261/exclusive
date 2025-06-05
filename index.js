require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// Enhanced CORS configuration for production
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://thomast43002.wixsite.com",
        "https://thomast43002.wixsite.com/exclusive-town-car",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["POST"],
  })
);

app.use(express.json());

// Input validation middleware
const validateRequest = (req, res, next) => {
  const { body } = req;

  // For reservation requests
  if (body.firstName) {
    if (!body.service || !body.phone || !body.date || !body.time) {
      return res
        .status(400)
        .json({ error: "Missing required reservation fields" });
    }
  }
  // For contact requests
  else if (body.contactName) {
    if (!body.contactPhone || !body.contactMessage) {
      return res.status(400).json({ error: "Missing required contact fields" });
    }
  } else {
    return res.status(400).json({ error: "Invalid request format" });
  }

  next();
};

app.post("/api/send", validateRequest, async (req, res) => {
  const data = req.body;

  // Configure transporter with failover options
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // For local testing
    },
  });

  // Enhanced email templates
  const isReservation = !!data.firstName;
  const emailSubject = isReservation
    ? `New Reservation: ${data.service} (${data.date})`
    : `Contact Request: ${data.service || "General Inquiry"}`;

  const emailHtml = isReservation
    ? `
      <h2>🚗 New Reservation Request</h2>
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Client:</strong> ${data.firstName} ${data.lastName}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ""}
      <p><strong>Date/Time:</strong> ${data.date} at ${data.time}</p>
      <p><strong>Passengers:</strong> ${data.passengers}</p>
      ${
        data.carSeats > 0
          ? `<p><strong>Car Seats:</strong> ${data.carSeats}</p>`
          : ""
      }
      ${
        data.notes
          ? `<p><strong>Notes:</strong><br>${data.notes.replace(
              /\n/g,
              "<br>"
            )}</p>`
          : ""
      }
    `
    : `
      <h2>📩 New Contact Request</h2>
      <p><strong>From:</strong> ${data.contactName}</p>
      <p><strong>Phone:</strong> ${data.contactPhone}</p>
      <p><strong>Email:</strong> ${data.contactEmail}</p>
      ${data.service ? `<p><strong>Service:</strong> ${data.service}</p>` : ""}
      <p><strong>Message:</strong><br>${data.contactMessage.replace(
        /\n/g,
        "<br>"
      )}</p>
    `;

  try {
    await transporter.sendMail({
      from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      replyTo: data.email || data.contactEmail,
      subject: emailSubject,
      text: message, // Keep plain text version
      html: emailHtml, // Add HTML version
    });

    // Add database logging here if needed
    console.log(
      `Email sent for ${isReservation ? "reservation" : "contact"} request`
    );

    res.status(200).json({
      success: true,
      message: "Your request has been submitted successfully!",
    });
  } catch (err) {
    console.error("Email error:", err);

    // More detailed error response
    res.status(500).json({
      success: false,
      error: "Failed to process your request",
      details: process.env.NODE_ENV === "development" ? err.message : null,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
