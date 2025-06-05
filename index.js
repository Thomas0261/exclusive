require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

const allowedOrigins = [
  'https://thomast43002.wixsite.com',
  'https://thomast43002-wixsite-com.filesusr.com',
  'http://localhost'
];

// Middleware
app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Health check
app.get('/', (req, res) => {
  res.send('✅ Exclusive backend is running.');
});

// Main form handler
app.post('/api/send', async (req, res) => {
  const body = req.body;
  let emailHtml = '';
  let subject = '';
  const now = new Date().toISOString();

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: 'Missing email credentials' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    // 🟢 Reservation Form
    if (body.firstName && body.date && body.time && body.service) {
      subject = `New Reservation - ${body.service} on ${body.date}`;
      emailHtml = `
        <h2>🚗 Reservation Request</h2>
        <p><strong>Name:</strong> ${body.firstName} ${body.lastName || ''}</p>
        <p><strong>Phone:</strong> ${body.phone}</p>
        <p><strong>Email:</strong> ${body.email || 'Not provided'}</p>
        <p><strong>Service:</strong> ${body.service}</p>
        <p><strong>Date:</strong> ${body.date} at ${body.time}</p>
        <p><strong>Passengers:</strong> ${body.passengers || 'N/A'}</p>
        <p><strong>Car Seats:</strong> ${body.carSeats || 'N/A'}</p>
        <p><strong>Notes:</strong><br>${body.notes || 'None'}</p>
        <hr><small>Received at: ${now}</small>
      `;
    }

    // 🟢 Contact Form
    else if (body.contactName && body.contactPhone && body.contactMessage) {
      subject = `📩 Contact Message from ${body.contactName}`;
      emailHtml = `
        <h2>📨 Contact Request</h2>
        <p><strong>Name:</strong> ${body.contactName}</p>
        <p><strong>Phone:</strong> ${body.contactPhone}</p>
        <p><strong>Email:</strong> ${body.contactEmail || 'Not provided'}</p>
        <p><strong>Service:</strong> ${body.service || 'Not specified'}</p>
        <p><strong>Message:</strong><br>${body.contactMessage}</p>
        <hr><small>Received at: ${now}</small>
      `;
    }

    // ❌ Invalid Request
    else {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    await transporter.sendMail({
      from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      subject,
      html: emailHtml,
      replyTo: body.email || body.contactEmail || process.env.EMAIL_USER
    });

    res.status(200).json({ success: true, message: 'Email sent' });

  } catch (err) {
    console.error('Email Error:', err);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});




// abwqshoumfqovvzw
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

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('CORS not allowed'));
//     }
//   },
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type'],
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Health check
// app.get('/', (req, res) => {
//   res.send('Welcome to exclusive rest api.');
// });

// // Form submission
// app.post('/api/send', async (req, res) => {
//   const data = req.body;
//   const isReservation = !!data.firstName;

//   if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//     return res.status(500).json({ error: 'Missing email credentials' });
//   }

//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     },
//     tls: { rejectUnauthorized: false }
//   });
// //abwqshoumfqovvzw
//   const subject = isReservation ? `New Reservation: ${data.service}` : `Contact Request`;

//   const html = isReservation


//   try {
//     await transporter.sendMail({
//       from: `"Exclusive" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
//       subject,
//       html
//     });

//     res.status(200).json({ success: true, message: 'Email sent' });
//   } catch (err) {
//     console.error('Email failed:', err.message);
//     res.status(500).json({ error: 'Email failed', details: err.message });
//   }
// });

// // Catch-all
// app.use((req, res) => {
//   res.status(404).json({ error: 'Not found', path: req.originalUrl });
// });

// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`✅ Server live on port ${PORT}`);
// });



