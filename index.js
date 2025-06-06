require("dotenv").config();
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();

// CORS setup
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

// Root
app.get("/", (req, res) => {
  res.send("🚗 SMS API is live");
});

// Send SMS
app.post("/api/send", async (req, res) => {
  const { firstName, lastName, phone, date, time, passengers, carSeats, service } = req.body;

  if (!firstName || !phone || !date || !time || !service) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const messageBody = `New Reservation:
Service: ${service}
Name: ${firstName} ${lastName || ""}
Phone: ${phone}
Date: ${date} at ${time}
Passengers: ${passengers || "N/A"}
Car Seats: ${carSeats || "N/A"}
`;

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.ADMIN_PHONE
    });

    res.status(200).json({ success: true, message: "SMS sent" });
  } catch (err) {
    console.error("❌ Twilio error:", err);
    res.status(500).json({ success: false, error: "Failed to send SMS" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 SMS backend running on port ${PORT}`);
});



// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const nodemailer = require("nodemailer");
// const twilio = require("twilio");

// const app = express();

// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// const allowedOrigins = [
//   "https://thomast43002.wixsite.com",
//   "https://thomast43002-wixsite-com.filesusr.com",
//   "http://localhost",
// ];

// app.use(express.json());
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   })
// );

// app.get("/", (req, res) => {
//   res.send("Welcome to exclusive rest api.");
// });

// app.post("/api/send", async (req, res) => {
//   const body = req.body;
//   const now = new Date().toISOString();
//   let subject = "";
//   let html = "";
//   let confirmationHtml = "";
//   let clientEmail = null;

//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       tls: { rejectUnauthorized: false },
//     });

//     if (body.firstName && body.date && body.time && body.service) {
//       subject = `🚗 Reservation - ${body.service} (${body.date})`;
//       html = `
//         <h2>🚗 New Reservation</h2>
//         <p><strong>Name:</strong> ${body.firstName} ${body.lastName || ""}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email || "Not provided"}</p>
//         <p><strong>Date & Time:</strong> ${body.date} at ${body.time}</p>
//         <p><strong>Passengers:</strong> ${body.passengers || "N/A"}</p>
//         <p><strong>Car Seats:</strong> ${body.carSeats || "N/A"}</p>
//         <p><strong>Service:</strong> ${body.service}</p>
//         <p><strong>Notes:</strong><br>${body.notes || "None"}</p>
//         <hr><small>Received at ${now}</small>
//       `;

//       confirmationHtml = `<div style="background:#f5f5f5;padding:40px;font-family:Arial;">
//   <div style="max-width:600px;margin:0 auto;background:#1b1b1b;color:#fff;border-radius:10px;overflow:hidden;">
//     <div style="background:#cae942;padding:20px;text-align:center;">
//       <h2 style="margin:0;color:#1b1b1b;">Reservation Confirmed</h2>
//     </div>
//     <div style="padding:30px;">
//       <p>Hi ${body.firstName},</p>
//       <p>Thank you for booking with <strong style="color:#cae942;">Exclusive Town Car Service</strong>.</p>
//       <p>We’ve received your reservation and will be in touch shortly.</p>
//       <hr style="border:0;border-top:1px solid #444;">
//       <p><strong>Service:</strong> ${body.service}</p>
//       <p><strong>Date:</strong> ${body.date}</p>
//       <p><strong>Time:</strong> ${body.time}</p>
//       <p><strong>Passengers:</strong> ${body.passengers || "N/A"}</p>
//       <p><strong>Phone:</strong> ${body.phone}</p>
//       <p style="margin-top:30px;font-size:12px;color:#bbb;">Sent at ${now}</p>
//     </div>
//   </div>
// </div>`;
//       clientEmail = body.email;

//       // ✅ Send SMS confirmation
//       if (body.phone) {
//         await twilioClient.messages.create({
//           from: process.env.TWILIO_PHONE_NUMBER,
//           to: body.phone,
//           body: `✅ Exclusive Town Car Booking Confirmed for ${body.service} on ${body.date} at ${body.time}. Thank you!`
//         });
//       }
//     } else if (body.name && body.phone && body.email && body.message) {
//       subject = `📩 Contact Inquiry - ${body.service || "General"}`;
//       html = `
//         <h2>📩 Contact Request</h2>
//         <p><strong>Name:</strong> ${body.name}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email}</p>
//         <p><strong>Service:</strong> ${body.service || "N/A"}</p>
//         <p><strong>Message:</strong><br>${body.message}</p>
//         <hr><small>Received at ${now}</small>
//       `;

//       confirmationHtml = `<div style="background:#f5f5f5;padding:40px;font-family:Arial;">
//   <div style="max-width:600px;margin:0 auto;background:#1b1b1b;color:#fff;border-radius:10px;overflow:hidden;">
//     <div style="background:#cae942;padding:20px;text-align:center;">
//       <h2 style="margin:0;color:#1b1b1b;">Message Received</h2>
//     </div>
//     <div style="padding:30px;">
//       <p>Hi ${body.name},</p>
//       <p>Thank you for contacting <strong style="color:#cae942;">Exclusive Town Car Service</strong>.</p>
//       <p>We’ve received your inquiry and will respond within 24 hours.</p>
//       <p style="margin-top:30px;font-size:12px;color:#bbb;">Sent at ${now}</p>
//     </div>
//   </div>
// </div>`;
//       clientEmail = body.email;
//     } else {
//       return res.status(400).json({ error: "Invalid request format" });
//     }

//     await transporter.sendMail({
//       from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
//       subject,
//       html,
//       replyTo: clientEmail,
//     });

//     if (clientEmail) {
//       await transporter.sendMail({
//         from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//         to: clientEmail,
//         subject: "✅ We've received your request",
//         html: confirmationHtml,
//       });
//     }

//     res.status(200).json({ success: true, message: "Email and SMS sent" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, error: "Failed to send notification" });
//   }
// });

// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });


// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const nodemailer = require("nodemailer");

// // Twilio
// const twilio = require('twilio');
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


// const app = express();

// const allowedOrigins = [
//   "https://thomast43002.wixsite.com",
//   "https://thomast43002-wixsite-com.filesusr.com",
//   "http://localhost",
// ];

// app.use(express.json());
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   })
// );

// app.get("/", (req, res) => {
//   res.send("Welcome to exclusive rest api.");
// });

// app.post("/api/send", async (req, res) => {
//   const body = req.body;
//   const now = new Date().toISOString();
//   let subject = "";
//   let html = "";
//   let confirmationHtml = "";
//   let clientEmail = null;

//   try {
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ error: "Missing email credentials" });
//     }

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       tls: { rejectUnauthorized: false },
//     });

//     if (body.firstName && body.date && body.time && body.service) {
//       subject = `🚗 Reservation - ${body.service} (${body.date})`;
//       html = `
//         <h2>🚗 New Reservation</h2>
//         <p><strong>Name:</strong> ${body.firstName} ${body.lastName || ""}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email || "Not provided"}</p>
//         <p><strong>Date & Time:</strong> ${body.date} at ${body.time}</p>
//         <p><strong>Passengers:</strong> ${body.passengers || "N/A"}</p>
//         <p><strong>Car Seats:</strong> ${body.carSeats || "N/A"}</p>
//         <p><strong>Service:</strong> ${body.service}</p>
//         <p><strong>Notes:</strong><br>${body.notes || "None"}</p>
//         <hr><small>Received at ${now}</small>
//       `;

//       confirmationHtml = `<div style="background:#f5f5f5;padding:40px;font-family:Arial;">
//   <div style="max-width:600px;margin:0 auto;background:#1b1b1b;color:#fff;border-radius:10px;overflow:hidden;">
//     <div style="background:#cae942;padding:20px;text-align:center;">
//       <h2 style="margin:0;color:#1b1b1b;">Reservation Confirmed</h2>
//     </div>
//     <div style="padding:30px;">
//       <p>Hi ${body.firstName},</p>
//       <p>Thank you for booking with <strong style="color:#cae942;">Exclusive Town Car Service</strong>.</p>
//       <p>We’ve received your reservation and will be in touch shortly.</p>
//       <hr style="border:0;border-top:1px solid #444;">
//       <p><strong>Service:</strong> ${body.service}</p>
//       <p><strong>Date:</strong> ${body.date}</p>
//       <p><strong>Time:</strong> ${body.time}</p>
//       <p><strong>Passengers:</strong> ${body.passengers || "N/A"}</p>
//       <p><strong>Phone:</strong> ${body.phone}</p>
//       <p style="margin-top:30px;font-size:12px;color:#bbb;">Sent at ${now}</p>
//     </div>
//   </div>
// </div>`;
//       clientEmail = body.email;
//     } else if (body.name && body.phone && body.email && body.message) {
//       subject = `📩 Contact Inquiry - ${body.service || "General"}`;
//       html = `
//         <h2>📩 Contact Request</h2>
//         <p><strong>Name:</strong> ${body.name}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email}</p>
//         <p><strong>Service:</strong> ${body.service || "N/A"}</p>
//         <p><strong>Message:</strong><br>${body.message}</p>
//         <hr><small>Received at ${now}</small>
//       `;

//       confirmationHtml = `<div style="background:#f5f5f5;padding:40px;font-family:Arial;">
//   <div style="max-width:600px;margin:0 auto;background:#1b1b1b;color:#fff;border-radius:10px;overflow:hidden;">
//     <div style="background:#cae942;padding:20px;text-align:center;">
//       <h2 style="margin:0;color:#1b1b1b;">Message Received</h2>
//     </div>
//     <div style="padding:30px;">
//       <p>Hi ${body.name},</p>
//       <p>Thank you for contacting <strong style="color:#cae942;">Exclusive Town Car Service</strong>.</p>
//       <p>We’ve received your inquiry and will respond within 24 hours.</p>
//       <p style="margin-top:30px;font-size:12px;color:#bbb;">Sent at ${now}</p>
//     </div>
//   </div>
// </div>`;
//       clientEmail = body.email;
//     } else {
//       return res.status(400).json({ error: "Invalid request format" });
//     }

//     await transporter.sendMail({
//       from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
//       subject,
//       html,
//       replyTo: clientEmail,
//     });

//     if (clientEmail) {
//       await transporter.sendMail({
//         from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//         to: clientEmail,
//         subject: "✅ We've received your request",
//         html: confirmationHtml,
//       });
//     }

//     res.status(200).json({ success: true, message: "Email sent" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, error: "Failed to send email" });
//   }
// });

// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });


// last


// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const nodemailer = require("nodemailer");

// const app = express();

// const allowedOrigins = [
//   "https://thomast43002.wixsite.com",
//   "https://thomast43002-wixsite-com.filesusr.com",
//   "http://localhost",
// ];

// app.use(express.json());
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   })
// );

// app.get("/", (req, res) => {
//   res.send("Welcome to exclusive rest api.");
// });

// app.post("/api/send", async (req, res) => {
//   const body = req.body;
//   const now = new Date().toISOString();
//   let subject = "";
//   let html = "";
//   let confirmationHtml = "";
//   let clientEmail = null;

//   try {
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ error: "Missing email credentials" });
//     }

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       tls: { rejectUnauthorized: false },
//     });

//     // Reservation
//     if (body.firstName && body.date && body.time && body.service) {
//       subject = `🚗 Reservation - ${body.service} (${body.date})`;
//       html = `
//         <h2>🚗 New Reservation</h2>
//         <p><strong>Name:</strong> ${body.firstName} ${body.lastName || ""}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email || "Not provided"}</p>
//         <p><strong>Date & Time:</strong> ${body.date} at ${body.time}</p>
//         <p><strong>Passengers:</strong> ${body.passengers || "N/A"}</p>
//         <p><strong>Car Seats:</strong> ${body.carSeats || "N/A"}</p>
//         <p><strong>Service:</strong> ${body.service}</p>
//         <p><strong>Notes:</strong><br>${body.notes || "None"}</p>
//         <hr><small>Received at ${now}</small>
//       `;

//       confirmationHtml = `
//        <div style="background-color:#f5f5f5;padding:40px 20px;font-family:'Helvetica Neue',Arial,sans-serif;">
//   <div style="max-width:600px;margin:0 auto;background-color:#2a2a2a;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.12);border:1px solid #3a3a3a;">
//     <!-- Header with Brand Accent -->
//     <div style="background-color:#cae942;padding:25px;text-align:center;">
//       <h1 style="color:#2a2a2a;margin:0;font-size:26px;font-weight:700;letter-spacing:1px;">RESERVATION CONFIRMED</h1>
//     </div>
    
//     <!-- Service Details Card -->
//     <div style="padding:30px;color:#ffffff;">
//       <div style="background-color:#333333;border-left:4px solid #cae942;padding:20px;border-radius:0 6px 6px 0;margin-bottom:25px;">
//         <h2 style="color:#cae942;margin-top:0;font-size:18px;text-transform:uppercase;">Service Details</h2>
//         <table style="width:100%;border-collapse:separate;border-spacing:0 10px;">
//           <tr>
//             <td style="width:30%;color:#cae942;font-weight:600;vertical-align:top;">Service:</td>
//             <td>Hotel ⇔ Airport - Towncar (1-3) - $70</td>
//           </tr>
//           <tr>
//             <td style="color:#cae942;font-weight:600;">Name:</td>
//             <td>Thomas Tilahun</td>
//           </tr>
//           <tr>
//             <td style="color:#cae942;font-weight:600;">Phone:</td>
//             <td>9164300261</td>
//           </tr>
//           <tr>
//             <td style="color:#cae942;font-weight:600;">Pickup:</td>
//             <td>2025-06-06 at 03:31</td>
//           </tr>
//           <tr>
//             <td style="color:#cae942;font-weight:600;">Passengers:</td>
//             <td>1</td>
//           </tr>
//         </table>
//       </div>
      
//       <!-- Personalized Message -->
//       <p style="font-size:16px;line-height:1.6;margin-bottom:20px;">Hi Thomas,</p>
//       <p style="font-size:16px;line-height:1.6;margin-bottom:20px;">
//         Thank you for choosing <strong style="color:#cae942;">Exclusive Town Cars</strong>. 
//         Your reservation is now <strong>confirmed</strong>, and we’re preparing your luxury transfer.
//       </p>
      
//       <!-- Gradient Divider -->
//       <div style="margin:30px 0;text-align:center;">
//         <div style="height:1px;background:linear-gradient(90deg, transparent, #cae942 20%, #cae942 80%, transparent);opacity:0.3;"></div>
//       </div>
      
//       <!-- Footer -->
//       <p style="font-size:14px;color:#aaaaaa;text-align:center;margin:0;">
//         Confirmation sent at ${now} • <span style="color:#cae942;">Exclusive Town Cars</span>
//       </p>
//     </div>
//   </div>
// </div>
//       `;

//       clientEmail = body.email;
//     }

//     // Contact
//     else if (body.name && body.phone && body.email && body.message) {
//       subject = `📩 Contact Inquiry - ${body.service || "General"}`;
//       html = `
//         <h2>📩 Contact Request</h2>
//         <p><strong>Name:</strong> ${body.name}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email}</p>
//         <p><strong>Service:</strong> ${body.service || "N/A"}</p>
//         <p><strong>Message:</strong><br>${body.message}</p>
//         <hr><small>Received at ${now}</small>
//       `;

//       confirmationHtml = `
//                <div style="background-color:#f5f5f5;padding:40px 20px;font-family:'Helvetica Neue',Arial,sans-serif;">
//   <div style="max-width:600px;margin:0 auto;background-color:#2a2a2a;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.12);border:1px solid #3a3a3a;">
//     <!-- Header with Brand Accent -->
//     <div style="background-color:#cae942;padding:25px;text-align:center;">
//       <h1 style="color:#2a2a2a;margin:0;font-size:26px;font-weight:700;letter-spacing:1px;">MESSAGE RECEIVED</h1>
//     </div>
    
//     <!-- Content -->
//     <div style="padding:30px;color:#ffffff;">
//       <!-- Personalized Greeting -->
//       <p style="font-size:16px;line-height:1.6;margin-bottom:20px;">Hi ${body.name},</p>
      
//       <!-- Thank You Message -->
//       <div style="background-color:#333333;border-left:4px solid #cae942;padding:20px;border-radius:0 6px 6px 0;margin-bottom:25px;">
//         <p style="font-size:16px;line-height:1.6;margin:0;">
//           Thank you for contacting <strong style="color:#cae942;">Exclusive Town Cars</strong>. 
//           We’ve received your inquiry and will respond within <strong>24 hours</strong>.
//         </p>
//       </div>
      
//       <!-- Call-to-Action (Optional) -->
//       <p style="font-size:15px;line-height:1.6;text-align:center;">
//         <a href="tel:+19164300261" style="color:#cae942;text-decoration:none;font-weight:600;">Need immediate assistance? Call us →</a>
//       </p>
      
//       <!-- Gradient Divider -->
//       <div style="margin:30px 0;text-align:center;">
//         <div style="height:1px;background:linear-gradient(90deg, transparent, #cae942 20%, #cae942 80%, transparent);opacity:0.3;"></div>
//       </div>
      
//       <!-- Footer -->
//       <p style="font-size:14px;color:#aaaaaa;text-align:center;margin:0;">
//         Confirmation sent at ${now} • <span style="color:#cae942;">Exclusive Town Cars</span>
//       </p>
//     </div>
//   </div>
// </div>
//       `;

//       clientEmail = body.email;
//     } else {
//       return res.status(400).json({ error: "Invalid request format" });
//     }

//     // Send email to admin
//     await transporter.sendMail({
//       from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
//       subject,
//       html,
//       replyTo: clientEmail,
//     });

//     // Send styled confirmation to client
//     if (clientEmail) {
//       await transporter.sendMail({
//         from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//         to: clientEmail,
//         subject: "✅ We've received your request",
//         html: confirmationHtml,
//       });
//     }

//     res.status(200).json({ success: true, message: "Email sent" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, error: "Failed to send email" });
//   }
// });

// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const nodemailer = require('nodemailer');

// const app = express();

// const allowedOrigins = [
//   'https://thomast43002.wixsite.com',
//   'https://thomast43002-wixsite-com.filesusr.com',
//   'http://localhost'
// ];

// app.use(express.json());
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type'],
//   credentials: true
// }));

// app.get('/', (req, res) => {
//   res.send('Welcome to exclusive rest api.');
// });

// app.post('/api/send', async (req, res) => {
//   const body = req.body;
//   const now = new Date().toISOString();
//   let subject = '';
//   let html = '';

//   try {
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ error: 'Missing email credentials' });
//     }

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       },
//       tls: { rejectUnauthorized: false }
//     });

//     let clientEmail = null;

//     // Reservation
//     if (body.firstName && body.date && body.time && body.service) {
//       subject = `🚗 Reservation - ${body.service} (${body.date})`;
//       html = `
//         <h2>🚗 New Reservation</h2>
//         <p><strong>Name:</strong> ${body.firstName} ${body.lastName || ''}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email || 'Not provided'}</p>
//         <p><strong>Date & Time:</strong> ${body.date} at ${body.time}</p>
//         <p><strong>Passengers:</strong> ${body.passengers || 'N/A'}</p>
//         <p><strong>Car Seats:</strong> ${body.carSeats || 'N/A'}</p>
//         <p><strong>Service:</strong> ${body.service}</p>
//         <p><strong>Notes:</strong><br>${body.notes || 'None'}</p>
//         <hr><small>Received at ${now}</small>
//       `;
//       clientEmail = body.email;
//     }

//     // Contact
//     else if (body.name && body.phone && body.email && body.message) {
//       subject = `📩 Contact Inquiry - ${body.service || 'General'}`;
//       html = `
//         <h2>📩 Contact Request</h2>
//         <p><strong>Name:</strong> ${body.name}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email}</p>
//         <p><strong>Service:</strong> ${body.service || 'N/A'}</p>
//         <p><strong>Message:</strong><br>${body.message}</p>
//         <hr><small>Received at ${now}</small>
//       `;
//       clientEmail = body.email;
//     } else {
//       return res.status(400).json({ error: 'Invalid request format' });
//     }

//     // Send to admin
//     await transporter.sendMail({
//       from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
//       subject,
//       html,
//       replyTo: body.email
//     });

//     // Also send confirmation to client if email is provided
//     if (clientEmail) {
//       await transporter.sendMail({
//         from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//         to: clientEmail,
//         subject: "Thank you for contacting Exclusive Town Cars",
//         html: `
//           <h3>Thank you for your request!</h3>
//           <p>We received your ${body.firstName ? 'reservation' : 'inquiry'} and will get back to you shortly.</p>
//           <hr><small>This is a confirmation email for your reference.</small>
//         `
//       });
//     }

//     res.status(200).json({ success: true, message: 'Email sent' });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, error: 'Failed to send email' });
//   }
// });

// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// working code #111

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const nodemailer = require('nodemailer');

// const app = express();

// const allowedOrigins = [
//   'https://thomast43002.wixsite.com',
//   'https://thomast43002-wixsite-com.filesusr.com',
//   'http://localhost'
// ];

// app.use(express.json());
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type'],
//   credentials: true
// }));

// app.get('/', (req, res) => {
//   res.send('Welcome to exclusive rest api.');
// });

// app.post('/api/send', async (req, res) => {
//   const body = req.body;
//   const now = new Date().toISOString();
//   let subject = '';
//   let html = '';

//   try {
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ error: 'Missing email credentials' });
//     }

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       },
//       tls: { rejectUnauthorized: false }
//     });

//     // Reservation
//     if (body.firstName && body.date && body.time && body.service) {
//       subject = `🚗 Reservation - ${body.service} (${body.date})`;
//       html = `
//         <h2>🚗 New Reservation</h2>
//         <p><strong>Name:</strong> ${body.firstName} ${body.lastName || ''}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email || 'Not provided'}</p>
//         <p><strong>Date & Time:</strong> ${body.date} at ${body.time}</p>
//         <p><strong>Passengers:</strong> ${body.passengers || 'N/A'}</p>
//         <p><strong>Car Seats:</strong> ${body.carSeats || 'N/A'}</p>
//         <p><strong>Service:</strong> ${body.service}</p>
//         <p><strong>Notes:</strong><br>${body.notes || 'None'}</p>
//         <hr><small>Received at ${now}</small>
//       `;
//     }

//     // Contact
//     else if (body.name && body.phone && body.email && body.message) {
//       subject = `📩 Contact Inquiry - ${body.service || 'General'}`;
//       html = `
//         <h2>📩 Contact Request</h2>
//         <p><strong>Name:</strong> ${body.name}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email}</p>
//         <p><strong>Service:</strong> ${body.service || 'N/A'}</p>
//         <p><strong>Message:</strong><br>${body.message}</p>
//         <hr><small>Received at ${now}</small>
//       `;
//     }

//     // Invalid format
//     else {
//       return res.status(400).json({ error: 'Invalid request format' });
//     }

//     await transporter.sendMail({
//       from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
//       subject,
//       html,
//       replyTo: body.email
//     });

//     res.status(200).json({ success: true, message: 'Email sent' });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, error: 'Failed to send email' });
//   }
// });

// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// - working Reservation Submit
// color cae942 1b1b1b

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const nodemailer = require('nodemailer');

// const app = express();

// const allowedOrigins = [
//   'https://thomast43002.wixsite.com',
//   'https://thomast43002-wixsite-com.filesusr.com',
//   'http://localhost'
// ];

// // Middleware
// app.use(express.json());
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type'],
//   credentials: true
// }));

// // Health check
// app.get('/', (req, res) => {
//   res.send('✅ Exclusive backend is running.');
// });

// // Main form handler
// app.post('/api/send', async (req, res) => {
//   const body = req.body;
//   let emailHtml = '';
//   let subject = '';
//   const now = new Date().toISOString();

//   try {
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       return res.status(500).json({ error: 'Missing email credentials' });
//     }

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       },
//       tls: { rejectUnauthorized: false }
//     });

//     // 🟢 Reservation Form
//     if (body.firstName && body.date && body.time && body.service) {
//       subject = `New Reservation - ${body.service} on ${body.date}`;
//       emailHtml = `
//         <h2>🚗 Reservation Request</h2>
//         <p><strong>Name:</strong> ${body.firstName} ${body.lastName || ''}</p>
//         <p><strong>Phone:</strong> ${body.phone}</p>
//         <p><strong>Email:</strong> ${body.email || 'Not provided'}</p>
//         <p><strong>Service:</strong> ${body.service}</p>
//         <p><strong>Date:</strong> ${body.date} at ${body.time}</p>
//         <p><strong>Passengers:</strong> ${body.passengers || 'N/A'}</p>
//         <p><strong>Car Seats:</strong> ${body.carSeats || 'N/A'}</p>
//         <p><strong>Notes:</strong><br>${body.notes || 'None'}</p>
//         <hr><small>Received at: ${now}</small>
//       `;
//     }

//     // 🟢 Contact Form
//     else if (body.contactName && body.contactPhone && body.contactMessage) {
//       subject = `📩 Contact Message from ${body.contactName}`;
//       emailHtml = `
//         <h2>📨 Contact Request</h2>
//         <p><strong>Name:</strong> ${body.contactName}</p>
//         <p><strong>Phone:</strong> ${body.contactPhone}</p>
//         <p><strong>Email:</strong> ${body.contactEmail || 'Not provided'}</p>
//         <p><strong>Service:</strong> ${body.service || 'Not specified'}</p>
//         <p><strong>Message:</strong><br>${body.contactMessage}</p>
//         <hr><small>Received at: ${now}</small>
//       `;
//     }

//     // ❌ Invalid Request
//     else {
//       return res.status(400).json({ error: 'Invalid request format' });
//     }

//     await transporter.sendMail({
//       from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
//       subject,
//       html: emailHtml,
//       replyTo: body.email || body.contactEmail || process.env.EMAIL_USER
//     });

//     res.status(200).json({ success: true, message: 'Email sent' });

//   } catch (err) {
//     console.error('Email Error:', err);
//     res.status(500).json({ success: false, error: 'Failed to send email' });
//   }
// });

// // Start server
// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// abwqshoumfqovvzw
