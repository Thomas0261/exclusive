require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

const allowedOrigins = [
  "https://thomast43002.wixsite.com",
  "https://thomast43002-wixsite-com.filesusr.com",
  "http://localhost",
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

app.get("/", (req, res) => {
  res.send("Welcome to exclusive rest api.");
});

app.post("/api/send", async (req, res) => {
  const body = req.body;
  const now = new Date().toISOString();
  let subject = "";
  let html = "";
  let confirmationHtml = "";
  let clientEmail = null;

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: "Missing email credentials" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    // Reservation
    if (body.firstName && body.date && body.time && body.service) {
      subject = `🚗 Reservation - ${body.service} (${body.date})`;
      html = `
        <h2>🚗 New Reservation</h2>
        <p><strong>Name:</strong> ${body.firstName} ${body.lastName || ""}</p>
        <p><strong>Phone:</strong> ${body.phone}</p>
        <p><strong>Email:</strong> ${body.email || "Not provided"}</p>
        <p><strong>Date & Time:</strong> ${body.date} at ${body.time}</p>
        <p><strong>Passengers:</strong> ${body.passengers || "N/A"}</p>
        <p><strong>Car Seats:</strong> ${body.carSeats || "N/A"}</p>
        <p><strong>Service:</strong> ${body.service}</p>
        <p><strong>Notes:</strong><br>${body.notes || "None"}</p>
        <hr><small>Received at ${now}</small>
      `;

      confirmationHtml = `
        <div style="background-color:#f8f8f8;padding:20px;font-family:'Helvetica Neue',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background-color:#1b1b1b;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <div style="background-color:#cae942;padding:20px;text-align:center;">
              <h1 style="color:#1b1b1b;margin:0;font-size:24px;">RESERVATION CONFIRMED!</h1>
            </div>
            
            <div style="padding:30px;color:#ffffff;">
              <div style="margin-bottom:25px;background-color:#252525;padding:20px;border-radius:6px;">
                <h2 style="color:#cae942;margin-top:0;font-size:20px;">Service Details</h2>
                <p style="margin:8px 0;"><strong>Service:</strong> Hotel ⇔ Airport - Towncar (1-3) - $70</p>
                <p style="margin:8px 0;"><strong>Name:</strong> Thomas Tilahun</p>
                <p style="margin:8px 0;"><strong>Phone:</strong> 9164300261</p>
                <p style="margin:8px 0;"><strong>Pickup:</strong> 2025-06-06 at 03:31</p>
                <p style="margin:8px 0;"><strong>Passengers:</strong> 1</p>
              </div>
              
              <p style="font-size:16px;line-height:1.6;">Hi Thomas,</p>
              <p style="font-size:16px;line-height:1.6;">Thank you for choosing <strong style="color:#cae942;">Exclusive Town Cars</strong>. Your reservation has been successfully received.</p>
              <p style="font-size:16px;line-height:1.6;">We'll contact you shortly to confirm your booking details.</p>
              
              <div style="margin:30px 0;text-align:center;">
                <div style="height:1px;background:linear-gradient(90deg, transparent, #cae942, transparent);"></div>
              </div>
              
              <p style="font-size:12px;color:#999;text-align:center;">Confirmation sent at ${now}</p>
            </div>
          </div>
        </div>
      `;

      clientEmail = body.email;
    }

    // Contact
    else if (body.name && body.phone && body.email && body.message) {
      subject = `📩 Contact Inquiry - ${body.service || "General"}`;
      html = `
        <h2>📩 Contact Request</h2>
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Phone:</strong> ${body.phone}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Service:</strong> ${body.service || "N/A"}</p>
        <p><strong>Message:</strong><br>${body.message}</p>
        <hr><small>Received at ${now}</small>
      `;

      confirmationHtml = `
                <div style="background-color:#f8f8f8;padding:20px;font-family:'Helvetica Neue',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background-color:#1b1b1b;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <div style="background-color:#cae942;padding:20px;text-align:center;">
              <h1 style="color:#1b1b1b;margin:0;font-size:24px;">MESSAGE RECEIVED</h1>
            </div>
            
            <div style="padding:30px;color:#ffffff;">
              <p style="font-size:16px;line-height:1.6;">Hi ${body.name},</p>
              <p style="font-size:16px;line-height:1.6;">Thank you for reaching out to <strong style="color:#cae942;">Exclusive Town Cars</strong>.</p>
              <p style="font-size:16px;line-height:1.6;">We've received your message and will respond as soon as possible.</p>
              
              <div style="margin:30px 0;text-align:center;">
                <div style="height:1px;background:linear-gradient(90deg, transparent, #cae942, transparent);"></div>
              </div>
              
              <p style="font-size:12px;color:#999;text-align:center;">Confirmation sent at ${now}</p>
            </div>
          </div>
        </div>
      `;

      clientEmail = body.email;
    } else {
      return res.status(400).json({ error: "Invalid request format" });
    }

    // Send email to admin
    await transporter.sendMail({
      from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      subject,
      html,
      replyTo: clientEmail,
    });

    // Send styled confirmation to client
    if (clientEmail) {
      await transporter.sendMail({
        from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
        to: clientEmail,
        subject: "✅ We've received your request",
        html: confirmationHtml,
      });
    }

    res.status(200).json({ success: true, message: "Email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

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
