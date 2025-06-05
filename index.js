require('dotenv').config(); // ✅ Load environment variables

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/send', async (req, res) => {
  const data = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,     // 👈 from .env
      pass: process.env.EMAIL_PASS      // 👈 from .env
    }
  });

  const message = data.firstName
    ? `🚗 Reservation Request:
Service: ${data.service}
Name: ${data.firstName} ${data.lastName}
Phone: ${data.phone}
Email: ${data.email}
Date: ${data.date}
Time: ${data.time}
Passengers: ${data.passengers}
Car Seats: ${data.carSeats}
Notes: ${data.notes}`
    : `📩 Contact Request:
Name: ${data.contactName}
Phone: ${data.contactPhone}
Email: ${data.contactEmail}
Service: ${data.service}
Message: ${data.contactMessage}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // receive at same inbox
      subject: data.firstName ? 'New Reservation' : 'New Contact Request',
      text: message
    });

    res.status(200).json({ message: 'Email sent!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Email sending failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
