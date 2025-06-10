require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

const allowedOrigins = [
  "https://thomast43002.wixsite.com",
  "https://thomast43002-wixsite-com.filesusr.com",
  "http://localhost"
];

app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

// Health Check
app.get("/", (req, res) => {
  res.send("🚗 SMS API is live");
});

// Reservation SMS Handler
app.post("/api/send", async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    date,
    time,
    passengers,
    carSeats,
    service
  } = req.body;

  if (!firstName || !phone || !date || !time || !service) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const messageBody = 
  `🚗 *New Reservation Alert*
──────────────────────────
🚘 Service: ${service}
👤 Name: ${firstName} ${lastName || ""}
📞 Phone: ${phone}
📅 Date: ${date}
⏰ Time: ${time}
👥 Passengers: ${passengers || "N/A"}
🪑 Car Seats: ${carSeats || "N/A"}`;

const confirmationMessage = 
`✅ Hi ${firstName},

Your reservation for *${service}* on ${date} at ${time} is confirmed.

A team member will contact you shortly to finalize the details.

– Exclusive Town Car Services`;


  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Send SMS to Admin
    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.ADMIN_PHONE
    });

    // Send Confirmation SMS to Client
    await client.messages.create({
      body: confirmationMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    res.status(200).json({ success: true, message: "SMS sent to admin and client" });

  } catch (err) {
    console.error("❌ Twilio error:", err.message);
    res.status(500).json({ success: false, error: "Failed to send SMS" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 SMS backend running on port ${PORT}`);
});
