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

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.send('Welcome to exclusive rest api.');
});

// Form submission
app.post('/api/send', async (req, res) => {
  const data = req.body;
  const isReservation = !!data.firstName;

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

  const subject = isReservation ? `New Reservation: ${data.service}` : `Contact Request`;

  const html = isReservation
    ? `<p><strong>Client:</strong> ${data.firstName} ${data.lastName}</p>
       <p><strong>Phone:</strong> ${data.phone}</p>
       <p><strong>Date:</strong> ${data.date} at ${data.time}</p>`
    : `<p><strong>Name:</strong> ${data.contactName}</p>
       <p><strong>Phone:</strong> ${data.contactPhone}</p>
       <p><strong>Message:</strong> ${data.contactMessage}</p>`;

  try {
    await transporter.sendMail({
      from: `"Exclusive" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      subject,
      html
    });

    res.status(200).json({ success: true, message: 'Email sent' });
  } catch (err) {
    console.error('Email failed:', err.message);
    res.status(500).json({ error: 'Email failed', details: err.message });
  }
});

// Catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server live on port ${PORT}`);
});



// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const nodemailer = require('nodemailer');

// const app = express();

// // 1. Enhanced CORS Configuration
// const allowedOrigins = [
//   'https://thomast43002.wixsite.com',
//   'https://thomast43002-wixsite-com.filesusr.com',
//   'http://localhost'
// ];

// // 2. Middleware Setup
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

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

// // 3. Request Logger
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
//   next();
// });

// // 4. Health Check Endpoint
// app.get('/', (req, res) => {
//   res.status(200).json({
//     status: 'Server is running',
//     endpoints: [
//       { method: 'GET', path: '/', description: 'Health check' },
//       { method: 'GET', path: '/health', description: 'Server status' },
//       { method: 'POST', path: '/api/send', description: 'Submit form data' }
//     ]
//   });
// });

// // 5. Health Status Endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // 6. Preflight Route
// app.options('/api/send', cors());

// // 7. Validation Middleware
// const validateRequest = (req, res, next) => {
//   const body = req.body;
  
//   if (!body) {
//     return res.status(400).json({ error: 'Request body is required' });
//   }

//   if (body.firstName) {
//     // Reservation validation
//     if (!body.service || !body.phone || !body.date || !body.time) {
//       return res.status(400).json({ 
//         error: 'Missing required reservation fields',
//         required: ['service', 'phone', 'date', 'time']
//       });
//     }
//   } else if (body.contactName) {
//     // Contact validation
//     if (!body.contactPhone || !body.contactMessage) {
//       return res.status(400).json({ 
//         error: 'Missing required contact fields',
//         required: ['contactPhone', 'contactMessage']
//       });
//     }
//   } else {
//     return res.status(400).json({ 
//       error: 'Invalid request format',
//       acceptedFormats: ['reservation', 'contact'] 
//     });
//   }

//   next();
// };

// // 8. Main Email Endpoint
// app.post('/api/send', validateRequest, async (req, res) => {
//   const data = req.body;
//   const isReservation = !!data.firstName;

//   try {
//     // Validate email config
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       throw new Error('Email configuration missing');
//     }

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       },
//       tls: { rejectUnauthorized: false }
//     });

//     const subject = isReservation
//       ? `New Reservation: ${data.service} (${data.date})`
//       : `Contact Request: ${data.contactName}`;

//     const html = isReservation
//       ? `
//         <h2>Reservation Details</h2>
//         <p><strong>Name:</strong> ${data.firstName} ${data.lastName || ''}</p>
//         <p><strong>Phone:</strong> ${data.phone}</p>
//         <p><strong>Email:</strong> ${data.email || 'Not provided'}</p>
//         <p><strong>Service:</strong> ${data.service}</p>
//         <p><strong>Date:</strong> ${data.date}</p>
//         <p><strong>Time:</strong> ${data.time}</p>
//         ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
//       `
//       : `
//         <h2>Contact Request</h2>
//         <p><strong>Name:</strong> ${data.contactName}</p>
//         <p><strong>Phone:</strong> ${data.contactPhone}</p>
//         <p><strong>Email:</strong> ${data.contactEmail || 'Not provided'}</p>
//         <p><strong>Message:</strong></p>
//         <p>${data.contactMessage}</p>
//       `;

//     const mailOptions = {
//       from: `"Exclusive Town Cars" <${process.env.EMAIL_USER}>`,
//       to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
//       replyTo: data.email || data.contactEmail || process.env.EMAIL_USER,
//       subject,
//       html
//     };

//     await transporter.sendMail(mailOptions);
    
//     res.status(200).json({ 
//       success: true,
//       message: 'Form submitted successfully'
//     });

//   } catch (error) {
//     console.error('Email error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to send email',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // 9. 404 Handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Endpoint not found',
//     requested: `${req.method} ${req.path}`,
//     availableEndpoints: [
//       { method: 'GET', path: '/', description: 'Health check' },
//       { method: 'GET', path: '/health', description: 'Server status' },
//       { method: 'POST', path: '/api/send', description: 'Submit form data' }
//     ]
//   });
// });

// // 10. Server Startup
// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log('Available endpoints:');
//   console.log(`- GET http://localhost:${PORT}/`);
//   console.log(`- GET http://localhost:${PORT}/health`);
//   console.log(`- POST http://localhost:${PORT}/api/send`);
// });