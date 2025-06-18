require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

const allowedOrigins = [
  "https://www.exclusivetowncarservice.com",      // ✅ your real domain
  "https://thomast43002.wixsite.com",             // your Wix site editor
  "https://thomast43002-wixsite-com.filesusr.com",// your site's media files
  "https://editor.wix.com",                       // Wix preview
  "https://manage.wix.com",                       // Wix admin
  "http://localhost",                             // dev mode
];

app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);


// Check API
app.get("/", (req, res) => {
  res.send("🚗 SMS API is live");
});

// Reservation Handler
app.post("/api/send", async (req, res) => {
  console.log("Body received from Wix form:", req.body); // ✅ Debug input

  const {
    firstName,
    lastName,
    phone,
    date,
    time,
    passengers,
    carSeats,
    service,
  } = req.body;

  if (!firstName || !phone || !date || !time || !service) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // ✅ Format phone number to E.164
  let formattedPhone = phone;
  if (!phone.startsWith('+')) {
    formattedPhone = '+1' + phone.replace(/\D/g, '');
  }

  const messageBody = `🚗 *New Reservation Alert*
──────────────────────────
🚘 Service: ${service}
👤 Name: ${firstName} ${lastName || ""}
📞 Phone: ${formattedPhone}
📅 Date: ${date}
⏰ Time: ${time}
👥 Passengers: ${passengers || "N/A"}
🪑 Car Seats: ${carSeats || 0} ($${carSeats * 15 || 0} additional)
`;

  const confirmationMessage = `✅ Hi ${firstName},

Your reservation for *${service}* on ${date} at ${time} is confirmed.
${carSeats > 0 ? `\nCar Seats: ${carSeats} ($${carSeats * 15} additional)` : ""}

We'll contact you shortly to finalize the details.

– Exclusive Town Car Services`;

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Admin SMS
    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.ADMIN_PHONE,
    });

    // Client SMS
    await client.messages.create({
      body: confirmationMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    res.status(200).json({ success: true, message: "SMS sent to admin and client" });

  } catch (err) {
    console.error("❌ Twilio error:", err.message);
    res.status(500).json({ success: false, error: "Failed to send SMS" });
  }
});

// Contact Handler
app.post("/api/contact", async (req, res) => {
  const { name, phone, email, message, service } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const contactMessage = `📨 *New Contact Inquiry*
──────────────────────────
🧑 Name: ${name}
📞 Phone: ${phone || "N/A"}
📧 Email: ${email}
📝 Message: ${message}
🚘 Service: ${service || "General Inquiry"}`;

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: contactMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.ADMIN_PHONE,
    });

    res.status(200).json({ success: true, message: "Contact message sent" });
  } catch (err) {
    console.error("❌ Twilio error (contact):", err.message);
    res.status(500).json({ success: false, error: "Failed to send contact message" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 SMS backend running on port ${PORT}`);
});
