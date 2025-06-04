const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/send', async (req, res) => {
  const data = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,   // Set in Render later
      pass: process.env.EMAIL_PASS    // Set in Render later
    }
  });

  const mailOptions = {
    from: data.email || process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `New Reservation from ${data.firstName || 'Client'}`,
    text: `
      Service: ${data.service}
      Name: ${data.firstName} ${data.lastName}
      Phone: ${data.phone}
      Email: ${data.email || 'N/A'}
      Date: ${data.date}
      Time: ${data.time}
      Passengers: ${data.passengers}
      Car Seats: ${data.carSeats}
      Notes: ${data.notes}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully." });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send email." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
