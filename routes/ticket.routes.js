var express = require("express");
const isAuthenticated = require("../middleware/isAuthenticated.js");
const Tickets = require("../models/Tickets.model");
const Events = require("../models/Events.model");
const Layouts = require("../models/Layouts.model");
const Blocks = require("../models/Blocks.model");
const Transactions = require("../models/Transaction.model.js");
const transporter = require("../configs/nodemailer.config.js");
var router = express.Router();


const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// Generate a QR code
const generateQRCodes = async (qrTextArray) => {
  try {
    const qrCodesArray = await Promise.all(qrTextArray.map(qrText => QRCode.toDataURL(qrText)));
    return qrCodesArray;
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


router.post("/create", async (req, res) => {
  console.log("Tickets Create:", req.body);
  try {
    const event = await Events.findById(req.body.event);
    if (!event) {
      console.log("Invalid Event Id!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid Event Id!" });
    }
    const layout = await Layouts.findById(req.body.layout);
    if (!layout) {
      console.log("Invalid Layout Id!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid Layout Id!" });
    }
    const block = await Blocks.findById(req.body.block);
    if (!block) {
      console.log("Invalid Block Id!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid Block Id!" });
    }
    const transaction = await Transactions.findById(req.body.transaction);
    if (!transaction) {
      console.log("Invalid transaction Id!");
      return res
        .status(400)
        .json({ success: false, message: "Invalid transaction Id!" });
    }
    const ticket = new Tickets({ ...req.body });
    await ticket.save();
    event.tickets.push(ticket._id);
    await event.save();
    await ticket.populate("event layout block");

    return res
      .status(201)
      .json({ success: true, message: "Ticket Created Successfully!", ticket });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.post("/:transactionId/send-email", async (req, res) => {
  try {
    const tickets = await Tickets.find({
      transaction: req.params.transactionId,
    });
    if (!tickets.length) {
      console.error("Failed to send tickets via email!");
      return res
        .status(400)
        .json({ success: false, message: "Failed to send tickets via email!" });
    }
    const qrCodeDataUrlArray = await generateQRCodes(tickets.map(ticket => ticket.qrCode));
    const qrCodeImageUrlArray = await Promise.all(qrCodeDataUrlArray.map(dataUrl => uploadQRCodeToCloudinary(dataUrl)))
    htmlimgs = qrCodeImageUrlArray.map(imgUrl => `<img src="${imgUrl}" alt="QR Code">`).join('\n')
    const html = ` <div>
    <h1>Hello Test,</h1>
    <p>Thank you for joining our platform. We're excited to have you on board!</p>
    <p>Your username is: Test</p>
    <p>Scan the QR code below to access your personalized link:</p>
    ${htmlimgs}
    <p>Best regards,</p>
    <p>The Team</p>
  </div>`
    const mailOptions = {
      from: process.env.SMTP_AUTH_USER,
      to: tickets[0].email,
      subject: "Thank You For Your Purchase",
      html
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

router.put("/:ticketId/edit", async (req, res) => {
  try {
    const ticket = await Tickets.findById(req.params.eventId).populate(
      "buyer event"
    );
    if (!ticket) {
      return res
        .status(400)
        .json({ success: true, message: "Ticket not found!" });
    }
    for (key in req.body) {
      if (
        req.body[key] === ticket[key] ||
        key === "event" ||
        key === "buyer" ||
        key === "layout" ||
        key === "block"
      ) {
        continue;
      } else {
        ticket[key] = req.body[key];
      }
    }
    await ticket.save();
    return res
      .status(200)
      .json({ success: true, message: "Ticket Edited!", ticket });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
router.get("/:ticketId/find", async (req, res) => {
  try {
    const ticket = await Tickets.findById(req.params.eventId).populate(
      "buyer event layout block"
    );
    if (!ticket) {
      return res
        .status(400)
        .json({ success: true, message: "Ticket not found!" });
    }
    return res.status(200).json({ success: true, message: "OK!", ticket });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
//maybe create a find tickets by eventId and/or by userId

router.get("/:transactionId/transaction/find", async (req, res) => {
  // console.log("Finding Tickets =====>>");
  try {
    const tickets = await Tickets.find({
      transaction: req.params.transactionId,
    }).populate("buyer event layout block");
    // console.log("Tickets:", tickets);

    if (tickets.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No tickets found for this transaction ID!",
        tickets,
      });
    }

    return res.status(200).json({ success: true, message: "OK!", tickets });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

router.get("/user/findAll", isAuthenticated, async (req, res) => {
  try {
    const tickets = await Tickets.find({ buyer: req.user._id }).populate(
      "buyer",
      "event",
      "layout",
      "block"
    );
    if (!tickets.length) {
      return res
        .status(200)
        .json({ success: true, message: `No ticket found!` });
    }
    return res.status(200).json({
      success: true,
      message: `Found ${tickets.length} tickets`,
      tickets,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
router.get("/findAll", async (req, res) => {
  try {
    const tickets = await Tickets.find().populate("buyer", "event");
    if (!tickets.length) {
      return res
        .status(200)
        .json({ success: true, message: `No ticket found!` });
    }
    return res.status(200).json({
      success: true,
      message: `Found ${tickets.length} tickets`,
      tickets,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
router.get("/:qrCode/validate", async (req, res) => {
  try {
    const ticket = Tickets.findOne({ qrCode: req.params.qrCode });
    if (!ticket) {
      console.error("This ticket has an invalid qrCode!");
      return res
        .status(400)
        .json({ success: false, message: "Ticket Invalid" });
    } else if (
      ticket.status.toLowerCase() === "canceled" ||
      ticket.status.toLowerCase() === "expired"
    ) {
      console.error("This ticket has been deactivated!");
      return res
        .status(400)
        .json({ success: false, message: "Ticket Invalid" });
    } else if (ticket.status === "active") {
      console.log("This is a Valid Ticket");
      return res
        .status(200)
        .json({ success: true, message: "Ticket Accepted" });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});
router.delete("/:ticketId/delete", async (req, res) => {
  try {
    const ticket = await Tickets.findById(req.params.eventId);
    if (!ticket) {
      res.status(400).json({ success: true, message: "Ticket not found!" });
    }
    await ticket.deleteOne();
    return res.status(200).json({ success: true, message: "Ticket Deleted!" });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
});

module.exports = router;
