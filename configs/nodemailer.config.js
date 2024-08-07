const nodemailer = require('nodemailer');

// Configure your SMTP server for sending emails
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT, // Use the appropriate port
  secure: false, // Set to true if using SSL/TLS
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASS,
  },
};

// Create the transporter
const transporter = nodemailer.createTransport(smtpConfig);

module.exports = transporter;