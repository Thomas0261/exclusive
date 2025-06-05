require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Allowed origins
const allowedOrigins = [
  'https://thomast43002.wixsite.com',
  'https://thomast43002-wixsite-com.filesusr.com',
  'http://localhost'
];

// Middleware
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Email sending route
app.post('/api/send', async (req, res) => {
  const data = req.body;

  // Validate
  const isReservation = !!data.firstName;
  const isContact = !!data.name;

  if (!isReservation && !isContact) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });

  const subject = isReservation
    ? `New Reservation from ${data.firstName} ${data.lastName}`
    : `Contact Request from ${data.name}`;

  const html = isReservation
    ? `
      <h2>🚗 Reservation Request</h2>
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.time}</p>
      <p><strong>Passengers:</strong> ${data.passengers}</p>
      <p><strong>Car Seats:</strong> ${data.carSeats}</p>
      ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
    `
    : `
      <h2>📩 Contact Inquiry</h2>
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Message:</strong><br>${data.message}</p>
    `;

  try {
    await transporter.sendMail({
      from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      replyTo: data.email || process.env.EMAIL_USER,
      subject,
      html
    });

    console.log(`✅ Email sent: ${subject}`);
    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('❌ Email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
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



