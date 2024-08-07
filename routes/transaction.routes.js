var express = require("express");

const Transactions = require("../models/Transaction.model.js");
var router = express.Router();
const isAuthenticated = require("../middleware/isAuthenticated.js");
const transporter = require("../configs/nodemailer.config.js");
const QRCode = require('qrcode');
const { v4: uuidv4 } = require("uuid");


const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// Generate a QR code
const generateQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error('QR Code Generation Error:', err);
  }
};

// Upload the QR code to Cloudinary
const uploadQRCodeToCloudinary = async (dataUrl) => {
  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'SpotMeUp/qr-codes',
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary Upload Error:', err);
  }
};

router.post('/send-email', async (req, res) => {
  try {
    const { recipientEmail, subject } = req.body;
    const qrCodeDataUrl = await generateQRCode(uuidv4());
    const qrCodeImageUrl = await uploadQRCodeToCloudinary(qrCodeDataUrl);

    const html = ` <div>
      <h1>Hello Test,</h1>
      <p>Thank you for joining our platform. We're excited to have you on board!</p>
      <p>Your username is: Test</p>
      <p>Scan the QR code below to access your personalized link:</p>
      <img src="${qrCodeImageUrl}" alt="QR Code">
      <p>Best regards,</p>
      <p>The Team</p>
    </div>`
  
    const mailOptions = {
      from: "no-reply@spotmeup.net",
      to: recipientEmail,
      subject,
      html,
    };
  
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

router.post("/create", async (req, res) => {
  try {
    const transaction = new Transactions(req.body);
    await transaction.save();
    return res
      .status(201)
      .json({ success: true, message: "Transaction Created!", transaction });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/:transactionId/find", async (req, res) => {
  try {
    const transaction = await Transactions.findById(req.params.transactionId);
    if (!transaction) {
      return res
        .status(400)
        .json({ success: true, message: "Transaction Not Found!" });
    }
    return res.status(200).json({ success: true, message: "OK!", transaction });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
router.get("/findAll", async (req, res) => {
  try {
    const transactions = await Transactions.find();
    if (!transactions.length) {
      return res
        .status(200)
        .json({
          success: true,
          message: "No Transactions Found!",
          transactions,
        });
    }
    return res
      .status(200)
      .json({ success: true, message: "OK!", transactions });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
router.get("/user/findAll", isAuthenticated, async (req, res) => {
  try {
    const transactions = await Transactions.find({ buyer: req.user });
    if (!transactions.length) {
      return res.status(200).json({
        success: true,
        message: "No Transactions Found!",
        transactions,
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "OK!", transactions });
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

module.exports = router;

// Delete Missing
// Edit Missing
